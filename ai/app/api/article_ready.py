# app/api/article_ready.py
from fastapi import APIRouter, Query
from typing import List, Any, Optional
from datetime import datetime
import psycopg2
from app.services.recommend_core import get_conn  # host=Veritas-db, db=appdb 등

router = APIRouter()

@router.get("/article")
def list_articles(
    limit: int = Query(18, ge=1, le=100),
    offset: int = Query(0, ge=0),
    hours_window: int = Query(48, ge=6, le=168),
    topk_return: int = Query(8, ge=1, le=20),
    nli_threshold: float = Query(0.1, ge=0.0, le=1.0),
    only_ready: bool = Query(False, description="추천 캐시가 준비된 기사만 반환")
):
    """
    기존 /api/article 와 유사하지만:
    - has_reco(해당 파라미터 조합의 캐시 유무) 추가
    - reco_count(해당 링크에 관련된 모든 캐시 갯수) 추가
    - reco_updated_at(해당 파라미터 조합의 최신 갱신시각) 추가
    - only_ready=1 이면 캐시 준비된 기사만
    - 기본 정렬: has_reco DESC, date DESC
    """
    conn = get_conn(); cur = conn.cursor()
    try:
        where = []
        params: List[Any] = []

        # 현재 파라미터 조합의 캐시 존재 여부 식
        ready_sql = """
            EXISTS (
              SELECT 1 FROM article_reco r
              WHERE r.base_link = n.link
                AND r.hours_window = %s
                AND r.topk_return = %s
                AND r.stance_threshold = %s
            )
        """
        params.extend([hours_window, topk_return, nli_threshold])

        if only_ready:
            where.append(ready_sql)

        where_clause = f"WHERE {' AND '.join(where)}" if where else ""
        sql = f"""
            SELECT
              n.id, n.title, n.content, n.date, n.link,
              {ready_sql} AS has_reco,
              (
                SELECT COUNT(*) FROM article_reco r2
                WHERE r2.base_link = n.link
              ) AS reco_count,
              (
                SELECT MAX(updated_at) FROM article_reco r3
                WHERE r3.base_link = n.link
                  AND r3.hours_window = %s
                  AND r3.topk_return = %s
                  AND r3.stance_threshold = %s
              ) AS reco_updated_at
            FROM news n
            {where_clause}
            ORDER BY has_reco DESC, n.date DESC NULLS LAST, n.id DESC
            LIMIT %s OFFSET %s
        """
        params.extend([hours_window, topk_return, nli_threshold, limit, offset])

        cur.execute(sql, params)
        rows = cur.fetchall()
        items = []
        for r in rows:
            n_id, title, content, dt, link, has_reco, reco_count, reco_upd = r
            items.append({
                "id": n_id,
                "title": title,
                "content": content,
                "date": dt.isoformat() if dt else None,
                "link": link,
                "has_reco": bool(has_reco),
                "reco_count": int(reco_count or 0),
                "reco_updated_at": reco_upd.isoformat() if reco_upd else None,
            })
        return {"count": len(items), "items": items}
    finally:
        cur.close(); conn.close()


@router.get("/article/ready-only")
def list_articles_ready_only(
    limit: int = Query(18, ge=1, le=100),
    offset: int = Query(0, ge=0),
    hours_window: int = Query(48, ge=6, le=168),
    topk_return: int = Query(8, ge=1, le=20),
    nli_threshold: float = Query(0.1, ge=0.0, le=1.0),
):
    """
    추천 캐시(해당 파라미터 조합)가 준비된 기사만 “전용 탭”용으로 반환.
    동일 링크 중 최신 updated_at 기준으로 1건만 뽑음.
    """
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute("""
            SELECT DISTINCT ON (n.link)
              n.id, n.title, n.content, n.date, n.link,
              r.updated_at
            FROM article_reco r
            JOIN news n ON n.link = r.base_link
            WHERE r.hours_window=%s AND r.topk_return=%s AND r.stance_threshold=%s
            ORDER BY n.link, r.updated_at DESC
            LIMIT %s OFFSET %s
        """, (hours_window, topk_return, nli_threshold, limit, offset))
        rows = cur.fetchall()
        items = []
        for r in rows:
            n_id, title, content, dt, link, reco_upd = r
            items.append({
                "id": n_id,
                "title": title,
                "content": content,
                "date": dt.isoformat() if dt else None,
                "link": link,
                "has_reco": True,
                "reco_count": None,
                "reco_updated_at": reco_upd.isoformat() if reco_upd else None,
            })
        return {"count": len(items), "items": items}
    finally:
        cur.close(); conn.close()
