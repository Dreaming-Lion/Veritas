# app/services/vector_store.py
from __future__ import annotations

from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import timezone
import logging
import time

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

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


def _ensure_collection(dim: int):
    collections = client.get_collections().collections
    names = {c.name for c in collections}
    if COLLECTION not in names:
        logger.info("[vector_store] 컬렉션 %s 이 없어 새로 생성합니다. dim=%d", COLLECTION, dim)
        client.recreate_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(
                size=dim,
                distance=Distance.COSINE,
            ),
        )
    else:
        logger.info("[vector_store] 컬렉션 %s 이미 존재. dim=%d", COLLECTION, dim)


def train_vectorizer_and_index_all(batch_size: int = 1000) -> Dict[str, int]:
    """
    news 테이블 전체를 대상으로
      1) TF-IDF vectorizer 학습 및 디스크 저장
      2) Qdrant에 벡터 + 메타데이터 '배치 업서트'

    배치용 함수. cron 이나 관리용 CLI 등에서 호출하면 됨.
    batch_size 로 Qdrant upsert를 쪼개서 타임아웃/메모리 부담을 줄인다.
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
        "[vector_store] step2 완료: dim=%d (TF-IDF 학습 %.2f초 소요)", dim, step2_time
    )

    _ensure_collection(dim)

    total = len(ids)
    indexed = 0

    logger.info(
        "[vector_store] step3: Qdrant upsert 시작 (total=%d, batch_size=%d)",
        total,
        batch_size,
    )

    for start in range(0, total, batch_size):
        end = min(start + batch_size, total)

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

        logger.info(
            "[vector_store] step3: upsert batch %d ~ %d / %d",
            start + 1,
            end,
            total,
        )
        client.upsert(collection_name=COLLECTION, points=points)
        indexed += len(points)

    total_time = time.time() - t_global_start
    logger.info(
        "[vector_store] 전체 TF-IDF 인덱스 재구축 완료: indexed=%d (총 %.2f초)",
        indexed,
        total_time,
    )
    return {"indexed": indexed}


def load_vectorizer() -> TfidfVectorizer:
    if not VECTORIZER_PATH.exists():
        raise RuntimeError(
            "TF-IDF vectorizer not found. "
            "먼저 train_vectorizer_and_index_all()을 실행해서 벡터라이저를 학습/저장하세요."
        )
    return joblib.load(VECTORIZER_PATH)


def _opposite_lean_values(base: Optional[str]) -> List[str]:
    """
    base lean에 대해 '반대 성향'으로 취급할 lean 값 목록을 반환.
      - progressive <-> conservative
      - centrist 는 진보/보수 모두와 대비
    """
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
    """
    쿼리 텍스트(TF-IDF) 기반으로 유사 기사 검색.
    1) 먼저 '반대 lean' + 시간창 필터로 검색
    2) 결과가 하나도 없으면 lean 필터 없이 시간창만으로 다시 검색

    => "반대 성향 기사만 필터링, 없으면 전체 fallback" 로직을 여기서 처리.
    """
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

    # lean 필터링
    opp_leans = _opposite_lean_values(base_lean)
    if opp_leans:
        lean_conds = [
            FieldCondition(key="lean", match=MatchValue(value=val)) for val in opp_leans
        ]
        flt_opp = Filter(
            must=must_conditions,
            should=lean_conds,
        )
        hits = client.search(
            collection_name=COLLECTION,
            query_vector=q_vec,
            limit=top_k,
            query_filter=flt_opp,
            with_payload=True,
        )
        if hits:
            return hits

    flt_all = Filter(must=must_conditions) if must_conditions else None
    hits_all = client.search(
        collection_name=COLLECTION,
        query_vector=q_vec,
        limit=top_k,
        query_filter=flt_all,
        with_payload=True,
    )
    return hits_all
