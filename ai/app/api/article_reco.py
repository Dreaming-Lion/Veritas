# app/api/article_reco.py
from fastapi import APIRouter, Query, BackgroundTasks, HTTPException, Response
from fastapi.encoders import jsonable_encoder
from datetime import timedelta, datetime, timezone
import psycopg2, psycopg2.extras

from app.services.recommend_core import get_conn, compute_recommendations, normalize_clicked

router = APIRouter()
CACHE_TTL_HOURS = 6

DDL_SQL = """
CREATE TABLE IF NOT EXISTS article_reco (
  base_link         TEXT NOT NULL,
  hours_window      INT  NOT NULL,
  topk_return       INT  NOT NULL,
  stance_threshold  DOUBLE PRECISION NOT NULL,
  normalized_link   TEXT NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recommendations   JSONB NOT NULL,
  PRIMARY KEY (base_link, hours_window, topk_return, stance_threshold)
);
CREATE INDEX IF NOT EXISTS idx_article_reco_updated_at ON article_reco (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_reco_base_link ON article_reco (base_link);
CREATE INDEX IF NOT EXISTS idx_article_reco_normalized ON article_reco (normalized_link);
"""

def ensure_cache_table():
    conn = get_conn(); cur = conn.cursor()
    try:
        for stmt in filter(None, DDL_SQL.split(";")):
            s = stmt.strip()
            if s:
                cur.execute(s + ";")
        conn.commit()
    finally:
        cur.close(); conn.close()

try:
    ensure_cache_table()
except Exception:
    pass

def _is_stale(updated_at, ttl_hours: int) -> bool:
    if not updated_at:
        return True
    now = datetime.now(timezone.utc)
    return (updated_at + timedelta(hours=ttl_hours)) < now

def _get_cache(base_link: str, hours_window: int, topk_return: int, stance_threshold: float):
    """
    base_link 또는 normalized_link 둘 다로 조회 (정규화 차이로 인한 캐시 미스 감소)
    """
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute("""
            SELECT recommendations, normalized_link, updated_at
            FROM article_reco
            WHERE (base_link=%s OR normalized_link=%s)
              AND hours_window=%s
              AND topk_return=%s
              AND stance_threshold=%s
            ORDER BY updated_at DESC
            LIMIT 1;
        """, (base_link, normalize_clicked(base_link), hours_window, topk_return, stance_threshold))
        row = cur.fetchone()
        return row if row else None
    except psycopg2.errors.UndefinedTable:
        conn.rollback()
        ensure_cache_table()
        return None
    finally:
        cur.close(); conn.close()

def _upsert_cache(base_link: str, hours_window: int, topk_return: int, stance_threshold: float,
                  normalized_link: str, payload: dict):
    conn = get_conn(); cur = conn.cursor()
    try:
        payload_json = jsonable_encoder(payload)
        cur.execute("""
            INSERT INTO article_reco (base_link, hours_window, topk_return, stance_threshold,
                                      normalized_link, recommendations)
            VALUES (%s, %s, %s, %s, %s, %s::jsonb)
            ON CONFLICT (base_link, hours_window, topk_return, stance_threshold)
            DO UPDATE SET
              normalized_link = EXCLUDED.normalized_link,
              recommendations = EXCLUDED.recommendations,
              updated_at = NOW();
        """, (base_link, hours_window, topk_return, stance_threshold,
              normalized_link, psycopg2.extras.Json(payload_json)))
        conn.commit()
    except psycopg2.Error as e:
        try:
            # 테이블 이슈 등 재시도
            if getattr(e, "pgcode", None):
                ensure_cache_table()
                conn.rollback()
                payload_json = jsonable_encoder(payload)
                cur.execute("""
                    INSERT INTO article_reco (base_link, hours_window, topk_return, stance_threshold,
                                              normalized_link, recommendations)
                    VALUES (%s, %s, %s, %s, %s, %s::jsonb)
                    ON CONFLICT (base_link, hours_window, topk_return, stance_threshold)
                    DO UPDATE SET
                      normalized_link = EXCLUDED.normalized_link,
                      recommendations = EXCLUDED.recommendations,
                      updated_at = NOW();
                """, (base_link, hours_window, topk_return, stance_threshold,
                      normalized_link, psycopg2.extras.Json(payload_json)))
                conn.commit()
            else:
                raise
        finally:
            pass
    finally:
        cur.close(); conn.close()

def _recompute_and_upsert(base_link: str, hours_window: int, topk_return: int, stance_threshold: float):
    res = compute_recommendations(base_link, hours_window, topk_return, stance_threshold)
    if "recommendations" in res:
        _upsert_cache(
            base_link=base_link,
            hours_window=hours_window,
            topk_return=topk_return,
            stance_threshold=stance_threshold,
            normalized_link=res.get("clicked") or normalize_clicked(base_link),
            payload=res
        )
    return res

def _handle_recommend(background_tasks: BackgroundTasks,
                      clicked_link: str,
                      hours_window: int,
                      topk_return: int,
                      nli_threshold: float,
                      allow_stale: bool):
    """
    캐시 우선 반환.
    - 캐시 HIT & 신선: 그대로 반환
    - 캐시 HIT & 오래됨:
        * allow_stale=True  -> 캐시 반환 + 백그라운드 리프레시
        * allow_stale=False -> 동기 재계산 후 최신값 반환
    - 캐시 MISS: 동기 계산 + 업서트 후 반환
    """
    cache = _get_cache(clicked_link, hours_window, topk_return, nli_threshold)
    if cache:
        payload, _, updated_at = cache
        stale = _is_stale(updated_at, CACHE_TTL_HOURS)
        if stale and not allow_stale:
            # 동기 재계산
            fresh = _recompute_and_upsert(clicked_link, hours_window, topk_return, nli_threshold)
            return fresh
        if stale and allow_stale:
            # 캐시 반환 + 백그라운드 리프레시
            background_tasks.add_task(_recompute_and_upsert, clicked_link, hours_window, topk_return, nli_threshold)
        return payload

    # MISS → 동기 계산
    result = _recompute_and_upsert(clicked_link, hours_window, topk_return, nli_threshold)
    return result

# ------------------- 라이브(캐시 우선) 엔드포인트 -------------------

@router.get("/article/recommend")
def recommend_articles(
    background_tasks: BackgroundTasks,
    clicked_link: str = Query(..., description="사용자가 클릭한 기사 URL"),
    hours_window: int = Query(48, ge=6, le=168),
    topk_return: int = Query(8, ge=1, le=20),
    nli_threshold: float = Query(0.1, ge=0.0, le=1.0),
    allow_stale: bool = Query(True, description="캐시가 오래돼도 우선 반환 후 재계산")
):
    return _handle_recommend(background_tasks, clicked_link, hours_window, topk_return, nli_threshold, allow_stale)

@router.get("/recommend")
def recommend_alias(
    background_tasks: BackgroundTasks,
    clicked_link: str = Query(...),
    hours_window: int = Query(48, ge=6, le=168),
    topk_return: int = Query(8, ge=1, le=20),
    nli_threshold: float = Query(0.1, ge=0.0, le=1.0),
    allow_stale: bool = Query(True)
):
    return _handle_recommend(background_tasks, clicked_link, hours_window, topk_return, nli_threshold, allow_stale)

@router.get("/rec/recommend")
def recommend_alias2(
    background_tasks: BackgroundTasks,
    clicked_link: str = Query(...),
    hours_window: int = Query(48, ge=6, le=168),
    topk_return: int = Query(8, ge=1, le=20),
    nli_threshold: float = Query(0.1, ge=0.0, le=1.0),
    allow_stale: bool = Query(True)
):
    return _handle_recommend(background_tasks, clicked_link, hours_window, topk_return, nli_threshold, allow_stale)

@router.get("/article/recommend-cached")
def recommend_cached_articles(
    clicked_link: str = Query(...),
    hours_window: int = Query(48, ge=6, le=168),
    topk_return: int = Query(8, ge=1, le=20),
    nli_threshold: float = Query(0.1, ge=0.0, le=1.0),
):
    row = _get_cache(clicked_link, hours_window, topk_return, nli_threshold)
    if not row:
        return Response(status_code=204)  # 캐시 없음은 204로
    payload, _, _ = row
    return payload

@router.get("/recommend-cached")
def recommend_cached_alias(**kwargs):
    return recommend_cached_articles(**kwargs)

@router.get("/rec/recommend-cached")
def recommend_cached_alias2(**kwargs):
    return recommend_cached_articles(**kwargs)
