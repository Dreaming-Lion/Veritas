# app/services/vector_store.py
from __future__ import annotations

from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import timezone
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer

from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    Range,
    MatchValue,
)

from app.services.recommend_core import get_conn

logger = logging.getLogger(__name__)

VECTORIZER_PATH = Path("models/tfidf_news.pkl")

QDRANT_HOST = "Veritas-qdrant"
QDRANT_PORT = 6333
COLLECTION = "news_tfidf"

client = QdrantClient(
    host=QDRANT_HOST,
    port=QDRANT_PORT,
    timeout=1800.0,
)


def _ensure_collection(dim: int):
    """
    Qdrant 컬렉션이 없으면 생성,
    있으면 dim 확인 후 다르면 recreate_collection 으로 갈아엎기.
    (TF-IDF 다시 학습할 때마다 차원 달라질 수 있으니 안전하게 처리)
    """
    collections = client.get_collections().collections
    names = {c.name for c in collections}

    if COLLECTION not in names:
        logger.info(
            "[vector_store] 컬렉션 %s 이 없어 새로 생성합니다. dim=%d",
            COLLECTION,
            dim,
        )
        client.recreate_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(
                size=dim,
                distance=Distance.COSINE,
            ),
        )
        return

    info = client.get_collection(COLLECTION)
    vectors_cfg = info.config.params.vectors
    
    if isinstance(vectors_cfg, VectorParams):
        existing_dim = vectors_cfg.size
    else:
        first_cfg = next(iter(vectors_cfg.values()))
        existing_dim = first_cfg.size

    if existing_dim != dim:
        logger.warning(
            "[vector_store] 컬렉션 %s 벡터 차원 불일치: existing=%d, new=%d. 컬렉션을 재생성합니다.",
            COLLECTION,
            existing_dim,
            dim,
        )
        client.recreate_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(
                size=dim,
                distance=Distance.COSINE,
            ),
        )
    else:
        logger.info(
            "[vector_store] 컬렉션 %s 이미 존재 & dim 동일: %d",
            COLLECTION,
            existing_dim,
        )


def train_vectorizer_and_index_all(batch_size: int = 1000) -> Dict[str, int]:
    """
    news 테이블 전체를 대상으로
      1) TF-IDF vectorizer 학습 및 디스크 저장
      2) Qdrant에 벡터 + 메타데이터 '배치 업서트'

    - TF-IDF는 한 번에 학습
    - Qdrant upsert는 ThreadPoolExecutor 로 병렬 처리 (I/O 바운드)
    """
    t_global_start = time.time()

    logger.info("[vector_store] step1: news 전체 SELECT 시작")

    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT id, title, COALESCE(content, summary, ''), link, source, lean, date
            FROM news
            WHERE link IS NOT NULL
              AND link <> '';
            """
        )
        rows = cur.fetchall()
    finally:
        cur.close()
        conn.close()

    if not rows:
        logger.info("[vector_store] step1: news row 없음, 인덱싱 스킵")
        return {"indexed": 0}

    ids = [r[0] for r in rows]
    titles = [r[1] for r in rows]
    texts = [r[2] for r in rows]
    links = [r[3] for r in rows]
    srcs = [r[4] for r in rows]
    leans = [r[5] for r in rows]
    dates = [r[6] for r in rows]

    step1_time = time.time() - t_global_start
    logger.info(
        "[vector_store] step1 완료: rows=%d (%.2f초 소요)",
        len(rows),
        step1_time,
    )

    logger.info("[vector_store] step2: TF-IDF fit_transform 시작")

    docs = [(t or "") + " " + ((x or "")[:1500]) for t, x in zip(titles, texts)]

    tfidf = TfidfVectorizer(min_df=2, ngram_range=(1, 2))
    X = tfidf.fit_transform(docs)

    VECTORIZER_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(tfidf, VECTORIZER_PATH)

    dim = X.shape[1]
    step2_time = time.time() - t_global_start - step1_time
    logger.info(
        "[vector_store] step2 완료: dim=%d (TF-IDF 학습 %.2f초 소요)",
        dim,
        step2_time,
    )

    _ensure_collection(dim)

    total = len(ids)
    logger.info(
        "[vector_store] step3: Qdrant upsert 시작 (total=%d, batch_size=%d)",
        total,
        batch_size,
    )

    def _build_points_for_range_and_upsert(start: int, end: int) -> int:
        X_batch = X[start:end].toarray().tolist()
        points: List[PointStruct] = []

        for offset, (doc_id, title, text, link, src, lean, dt) in enumerate(
            zip(
                ids[start:end],
                titles[start:end],
                texts[start:end],
                links[start:end],
                srcs[start:end],
                leans[start:end],
                dates[start:end],
            )
        ):
            vec = X_batch[offset]

            if dt is not None:
                dt_utc = dt
                if dt_utc.tzinfo is None:
                    dt_utc = dt_utc.replace(tzinfo=timezone.utc)
                ts = int(dt_utc.timestamp())
                date_iso = dt_utc.isoformat()
            else:
                ts = None
                date_iso = None

            payload: Dict[str, Any] = {
                "id": int(doc_id),
                "title": title,
                "content": text,
                "link": link,
                "source": src,
                "lean": lean,
                "date_ts": ts,
                "date": date_iso,
            }
            points.append(PointStruct(id=int(doc_id), vector=vec, payload=payload))

        client.upsert(collection_name=COLLECTION, points=points)

        logger.info(
            "[vector_store] step3: (done) upsert batch %d ~ %d (count=%d)",
            start + 1,
            end,
            len(points),
        )
        return len(points)

    batch_ranges = list(range(0, total, batch_size))
    if not batch_ranges:
        logger.info("[vector_store] 인덱싱 대상 없음")
        return {"indexed": 0}

    max_workers = min(4, len(batch_ranges))  
    logger.info(
        "[vector_store] step3: ThreadPoolExecutor 시작 (max_workers=%d, batches=%d)",
        max_workers,
        len(batch_ranges),
    )

    indexed = 0
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = []
        for start in batch_ranges:
            end = min(start + batch_size, total)
            logger.info(
                "[vector_store] step3: (enqueue) upsert batch %d ~ %d / %d",
                start + 1,
                end,
                total,
            )
            futures.append(ex.submit(_build_points_for_range_and_upsert, start, end))

        for f in as_completed(futures):
            try:
                n = f.result()
                indexed += n
            except Exception as e:
                logger.exception("[vector_store] 배치 업서트 실패: %s", e)

    total_time = time.time() - t_global_start
    logger.info(
        "[vector_store] 전체 TF-IDF 인덱스 재구축 완료: indexed=%d (총 %.2f초)",
        indexed,
        total_time,
    )

    try:
        count_res = client.count(collection_name=COLLECTION, exact=True)
        logger.info(
            "[vector_store] Qdrant 컬렉션 %s 현재 포인트 개수: %d",
            COLLECTION,
            count_res.count,
        )
    except Exception as e:
        logger.warning("[vector_store] Qdrant 포인트 개수 조회 실패: %s", e)

    return {"indexed": indexed}


def load_vectorizer() -> TfidfVectorizer:
    if not VECTORIZER_PATH.exists():
        raise RuntimeError(
            "TF-IDF vectorizer not found. "
            "먼저 train_vectorizer_and_index_all()을 실행해서 벡터라이저를 학습/저장하세요."
        )
    return joblib.load(VECTORIZER_PATH)


def _opposite_lean_values(base: Optional[str]) -> List[str]:
    if base == "progressive":
        return ["conservative"]
    if base == "conservative":
        return ["progressive"]
    if base == "centrist":
        return ["progressive", "conservative"]
    return []


def search_similar_with_lean_fallback(
    query_text: str,
    *,
    base_lean: Optional[str],
    base_date,
    hours_window: int,
    top_k: int = 50,
):
    tfidf = load_vectorizer()
    q_vec = tfidf.transform([query_text]).toarray()[0].tolist()

    must_conditions: List[FieldCondition] = []
    if base_date is not None:
        dt_utc = base_date
        if dt_utc.tzinfo is None:
            dt_utc = dt_utc.replace(tzinfo=timezone.utc)
        ts_center = int(dt_utc.timestamp())
        ts_from = ts_center - hours_window * 3600
        ts_to = ts_center + hours_window * 3600

        must_conditions.append(
            FieldCondition(
                key="date_ts",
                range=Range(gte=ts_from, lte=ts_to),
            )
        )

    opp_leans = _opposite_lean_values(base_lean)
    if opp_leans:
        lean_conds = [
            FieldCondition(key="lean", match=MatchValue(value=val))
            for val in opp_leans
        ]
        flt_opp = Filter(
            must=must_conditions,
            should=lean_conds,
        )

        res = client.query_points(
            collection_name=COLLECTION,
            query=q_vec,
            query_filter=flt_opp,
            limit=top_k,
            with_payload=True,
        )
        hits = res.points
        if hits:
            return hits

    flt_all = Filter(must=must_conditions) if must_conditions else None
    res_all = client.query_points(
        collection_name=COLLECTION,
        query=q_vec,
        query_filter=flt_all,
        limit=top_k,
        with_payload=True,
    )
    return res_all.points
