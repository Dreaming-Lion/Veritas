# app/api/bookmarks.py
from typing import Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
import psycopg2, os
from app.api.routes_auth import get_current_user

# /api/bookmarks 이하 전담
router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])

# ===== DB 연결 =====
def get_conn():
    return psycopg2.connect(
        host=os.getenv("PGHOST", "Veritas-db"),
        dbname=os.getenv("PGDATABASE", "appdb"),
        user=os.getenv("PGUSER", "appuser"),
        password=os.getenv("PGPASSWORD", "apppw"),
        port=int(os.getenv("PGPORT", "5432")),
    )

def init_bookmark_db():
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS bookmarks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            article_id INTEGER NOT NULL REFERENCES news(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (user_id, article_id)
        );
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS ix_bookmarks_user_created_at
        ON bookmarks(user_id, created_at DESC);
    """)
    conn.commit(); cur.close(); conn.close()

# ===== 유틸 =====
def uid(user) -> int:
    """
    SQLAlchemy 모델(User) 또는 dict 모두 지원.
    getattr의 default는 즉시 평가되므로 사용하지 않고 분기 처리.
    """
    # 1) SQLAlchemy 모델 처럼 attribute 접근 가능한 경우
    if hasattr(user, "id"):
        return int(getattr(user, "id"))
    # 2) dict payload 형태인 경우
    if isinstance(user, dict) and "id" in user:
        return int(user["id"])
    # 3) 잘못된 인증 컨텍스트
    raise HTTPException(status_code=401, detail="Invalid authenticated user payload")

def iso(dt: Optional[datetime | date]):
    if not dt:
        return None
    return dt.isoformat()

# 차후에 models에 스키마 분리해서 필요한 코드만 남기기 !!!! (잊으면 안 돼 나야...)
class BookmarkCreate(BaseModel):
    article_id: int

class ApiArticle(BaseModel):
    id: int
    title: str
    content: Optional[str] = None
    summary: Optional[str] = None
    date: Optional[str] = None
    link: Optional[str] = None

class BookmarkListResponse(BaseModel):
    count: int
    articles: list[ApiArticle]

class BookmarkExistsResponse(BaseModel):
    saved: bool

# GET /api/bookmarks
@router.get("", response_model=BookmarkListResponse, summary="내 북마크 목록")
@router.get("/", response_model=BookmarkListResponse, include_in_schema=False)
def list_bookmarks(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user = Depends(get_current_user),
):
    init_bookmark_db()
    _uid = uid(user)

    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM bookmarks WHERE user_id=%s", (_uid,))
    total = cur.fetchone()[0] or 0

    cur.execute("""
        SELECT n.id, n.title, n.content, n.summary, n.date, n.link
        FROM bookmarks b
        JOIN news n ON n.id = b.article_id
        WHERE b.user_id = %s
        ORDER BY b.created_at DESC
        LIMIT %s OFFSET %s
    """, (_uid, limit, offset))
    rows = cur.fetchall()
    cur.close(); conn.close()

    arts: list[ApiArticle] = []
    for _id, title, content, summary, dt, link in rows:
        arts.append(ApiArticle(
            id=_id,
            title=title or "",
            content=content or "",
            summary=summary or "",
            date=iso(dt),
            link=link or "",
        ))
    return BookmarkListResponse(count=total, articles=arts)

# GET /api/bookmarks/{article_id}/exists
@router.get("/{article_id}/exists", response_model=BookmarkExistsResponse, summary="특정 기사 북마크 여부")
def exists_bookmark(article_id: int, user = Depends(get_current_user)):
    init_bookmark_db()
    _uid = uid(user)
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "SELECT 1 FROM bookmarks WHERE user_id=%s AND article_id=%s LIMIT 1",
        (_uid, article_id),
    )
    saved = cur.fetchone() is not None
    cur.close(); conn.close()
    return BookmarkExistsResponse(saved=saved)

# POST /api/bookmarks
@router.post("", status_code=status.HTTP_201_CREATED, summary="북마크 추가")
@router.post("/", status_code=status.HTTP_201_CREATED, include_in_schema=False)
def add_bookmark(payload: BookmarkCreate, user = Depends(get_current_user)):
    init_bookmark_db()
    _uid = uid(user)

    conn = get_conn(); cur = conn.cursor()
    # 기사 존재 확인
    cur.execute("SELECT 1 FROM news WHERE id=%s LIMIT 1", (payload.article_id,))
    if cur.fetchone() is None:
        cur.close(); conn.close()
        raise HTTPException(status_code=404, detail="Article not found")

    # 멱등 upsert
    cur.execute("""
        INSERT INTO bookmarks(user_id, article_id)
        VALUES (%s, %s)
        ON CONFLICT (user_id, article_id) DO NOTHING
    """, (_uid, payload.article_id))
    conn.commit()
    cur.close(); conn.close()
    return {"detail": "Created"}

# DELETE /api/bookmarks/{article_id}
@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT, summary="북마크 삭제")
def remove_bookmark(article_id: int, user = Depends(get_current_user)):
    init_bookmark_db()
    _uid = uid(user)
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "DELETE FROM bookmarks WHERE user_id=%s AND article_id=%s",
        (_uid, article_id),
    )
    conn.commit()
    cur.close(); conn.close()
    return
