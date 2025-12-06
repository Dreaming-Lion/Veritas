# app/services/vector_store.py
from __future__ import annotations

from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import timezone
import logging
import time
import os

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

logger = logging.getLogger(__name__)

VECTORIZER_PATH = Path("models/tfidf_news.pkl")

# Docker 환경 변수 기반으로 Qdrant 접속
QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
COLLECTION = "news_tfidf"

client = QdrantClient(
    host=QDRANT_HOST,
    port=QDRANT_PORT,
    timeout=1800.0,
)


def train_vectorizer_and_index_all(batch_size: int = 1000) -> Dict[str, int]:
    """
    news 테이블 전체를 대상으로
      1) TF-IDF vectorizer 학습 및 디스크 저장
      2) Qdrant에 벡터 + 메타데이터 '배치 업서트'

    batch_size 로 Qdrant upsert를 쪼개서 타임아웃/메모리 부담을 줄인다.

    ⚠️ 매번 호출 시 Qdrant 컬렉션(news_tfidf)을 dim에 맞게 recreate_collection으로
       '항상' 새로 만든다. (dim 꼬임 방지)
    """
    # 순환 import 피하려고 함수 안에서 import
    from app.services.recommend_core import get_conn

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

    # 🔥 매번 컬렉션을 dim에 맞게 새로 생성 (dim 꼬임 방지)
    logger.info(
        "[vector_store] 컬렉션 %s 를 dim=%d 로 recreate_collection 합니다.",
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

    total = len(ids)
    logger.info(
        "[vector_store] step3: Qdrant upsert 시작 (total=%d, batch_size=%d)",
        total,
        batch_size,
    )

    indexed = 0

    for start in range(0, total, batch_size):
        end = min(start + batch_size, total)
        logger.info(
            "[vector_store] step3: upsert batch %d ~ %d / %d",
            start + 1,
            end,
            total,
        )

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
            "[vector_store] step3: calling client.upsert() for batch %d ~ %d (count=%d)",
            start + 1,
            end,
            len(points),
        )
        try:
            client.upsert(collection_name=COLLECTION, points=points)
        except Exception as e:
            import traceback
            logger.error(
                "[vector_store] Qdrant upsert 실패 (batch %d ~ %d): %r",
                start + 1,
                end,
                e,
            )
            traceback.print_exc()
            raise
        indexed += len(points)
        logger.info(
            "[vector_store] step3: done upsert batch %d ~ %d (누적 indexed=%d)",
            start + 1,
            end,
            indexed,
        )

    total_time = time.time() - t_global_start
    logger.info(
        "[vector_store] 전체 TF-IDF 인덱스 재구축 완료: indexed=%d (총 %.2f초)",
        indexed,
        total_time,
    )

    # Qdrant 컬렉션 실제 포인트 개수도 한 번 찍기
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
    """
    디스크에서 TF-IDF vectorizer 로드.
    없으면 에러 발생 (먼저 train_vectorizer_and_index_all 실행 필요).
    """
    if not VECTORIZER_PATH.exists():
        raise RuntimeError(
            "TF-IDF vectorizer not found. "
            "먼저 train_vectorizer_and_index_all()을 실행해서 벡터라이저를 학습/저장하세요."
        )
    return joblib.load(VECTORIZER_PATH)


def _opposite_lean_values(base: Optional[str]) -> List[str]:
    """
    기준 lean에 따라 '반대편' 성향 리스트를 반환
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
    TF-IDF 쿼리 벡터 기반으로 Qdrant에서 유사 기사 검색.

    1) base_date 기준 시간창(hours_window) 안에서 먼저 필터링
    2) 기준 기사 정치 성향(base_lean)의 '반대편' lean만 우선 검색
       - 반대 lean 결과가 하나도 없으면 lean 제한 없이 전체 검색
    """
    tfidf = load_vectorizer()
    q_vec = tfidf.transform([query_text]).toarray()[0].tolist()

    must_conditions: List[FieldCondition] = []

    # 시간 필터 (date_ts 범위)
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

    # 1) 먼저 반대 lean만 대상으로 검색 시도
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

    # 2) 반대 lean 결과가 없으면 lean 제한 없이 전체 검색
    flt_all = Filter(must=must_conditions) if must_conditions else None
    res_all = client.query_points(
        collection_name=COLLECTION,
        query=q_vec,
        query_filter=flt_all,
        limit=top_k,
        with_payload=True,
    )
    return res_all.points
