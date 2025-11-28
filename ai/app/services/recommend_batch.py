# app/services/recommend_batch.py
from __future__ import annotations

import psycopg2, psycopg2.extras
from datetime import datetime, timedelta, timezone
from typing import Iterable, List, Tuple

from fastapi.encoders import jsonable_encoder

from app.services.recommend_core import (
    get_conn,
    compute_recommendations,
    normalize_clicked,
)

DEFAULT_HOURS_WINDOW = 48
DEFAULT_TOPK = 8
DEFAULT_STANCE = 0.15

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
"""

def _ensure_cache_table() -> None:
    """article_reco 캐시 테이블이 없으면 생성."""
    conn = get_conn(); cur = conn.cursor()
    try:
        for stmt in filter(None, (s.strip() for s in DDL_SQL.split(";"))):
            cur.execute(stmt + ";")
        conn.commit()
    finally:
        cur.close(); conn.close()

try:
    _ensure_cache_table()
except Exception:
    pass

def _fetch_recent_links(lookback_hours: int, max_items: int) -> List[str]:
    """
    최근 lookback_hours 동안 들어온 모든 RSS 뉴스 기사 링크를 최신순으로 가져옴
    """
    conn = get_conn(); cur = conn.cursor()
    try:
        since = datetime.now(timezone.utc) - timedelta(hours=lookback_hours)
        cur.execute(
            """
            SELECT link
            FROM news
            WHERE link IS NOT NULL
              AND link <> ''
              AND date >= %s
            ORDER BY date DESC NULLS LAST, id DESC
            LIMIT %s;
            """,
            (
                since,
                max_items,
            ),
        )
        rows = cur.fetchall()
        return [r[0] for r in rows if r and r[0]]
    finally:
        cur.close(); conn.close()


def _safe_json(payload: dict) -> dict:
    """
    JSONB에 넣기 전에 datetime/date/Decimal 등을 문자열/기본형으로 변환.
    """
    return jsonable_encoder(payload)

def _upsert(
    base_link: str,
    hours_window: int,
    topk: int,
    stance: float,
    normalized: str,
    payload: dict,
) -> None:
    """
    article_reco 캐시에 UPSERT.
    - payload는 반드시 jsonable_encoder를 거쳐야 한다.
    """
    conn = get_conn(); cur = conn.cursor()
    try:
        safe = _safe_json(payload)
        cur.execute(
            """
            INSERT INTO article_reco (
                base_link, hours_window, topk_return, stance_threshold,
                normalized_link, recommendations
            )
            VALUES (%s, %s, %s, %s, %s, %s::jsonb)
            ON CONFLICT (base_link, hours_window, topk_return, stance_threshold)
            DO UPDATE SET
                normalized_link = EXCLUDED.normalized_link,
                recommendations = EXCLUDED.recommendations,
                updated_at      = NOW();
            """,
            (base_link, hours_window, topk, stance, normalized, psycopg2.extras.Json(safe)),
        )
        conn.commit()
    except psycopg2.errors.UndefinedTable:
        conn.rollback()
        _ensure_cache_table()
        safe = _safe_json(payload)
        cur.execute(
            """
            INSERT INTO article_reco (
                base_link, hours_window, topk_return, stance_threshold,
                normalized_link, recommendations
            )
            VALUES (%s, %s, %s, %s, %s, %s::jsonb)
            ON CONFLICT (base_link, hours_window, topk_return, stance_threshold)
            DO UPDATE SET
                normalized_link = EXCLUDED.normalized_link,
                recommendations = EXCLUDED.recommendations,
                updated_at      = NOW();
            """,
            (base_link, hours_window, topk, stance, normalized, psycopg2.extras.Json(safe)),
        )
        conn.commit()
    finally:
        cur.close(); conn.close()

def precompute_recent(
    *,
    hours_window: int = DEFAULT_HOURS_WINDOW,
    topk_return: int = DEFAULT_TOPK,
    stance_threshold: float = DEFAULT_STANCE,
    lookback_hours: int = 72,
    max_items: int = 600,
) -> dict:
    """
    최근 기사들에 대해 추천 결과를 미리 계산하여 article_reco 캐시에 저장.

    Returns:
        {"scanned": int, "cached": int}
    """
    try:
        _ensure_cache_table()
    except Exception:
        pass

    links = _fetch_recent_links(lookback_hours=lookback_hours, max_items=max_items)

    cached = 0
    for link in links:
        try:
            res = compute_recommendations(
                clicked_link=link,
                hours_window=hours_window,
                topk_return=topk_return,
                stance_threshold=stance_threshold,
            )
        except Exception:
            continue

        if not isinstance(res, dict) or "recommendations" not in res:
            continue

        normalized = res.get("clicked") or normalize_clicked(link)

        try:
            _upsert(
                base_link=link,
                hours_window=hours_window,
                topk=topk_return,
                stance=stance_threshold,
                normalized=normalized,
                payload=res,
            )
            cached += 1
        except Exception:
            continue

    return {"scanned": len(links), "cached": cached}
