# app/api/inquiries.py
from typing import Optional, Literal
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
import psycopg2, os
from app.api.routes_auth import get_current_user

router = APIRouter(prefix="/inquiries", tags=["inquiries"])

# ===== DB 연결 =====
def get_conn():
    return psycopg2.connect(
        host=os.getenv("PGHOST", "Veritas-db"),
        dbname=os.getenv("PGDATABASE", "appdb"),
        user=os.getenv("PGUSER", "appuser"),
        password=os.getenv("PGPASSWORD", "apppw"),
        port=int(os.getenv("PGPORT", "5432")),
    )

def init_inquiry_db():
    conn = get_conn(); cur = conn.cursor()
    # 기본 테이블
    cur.execute("""
        CREATE TABLE IF NOT EXISTS inquiries (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending', -- pending | answered | closed
            is_public BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    """)
    # 인덱스
    cur.execute("CREATE INDEX IF NOT EXISTS ix_inquiries_user_created ON inquiries(user_id, created_at DESC);")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_inquiries_status ON inquiries(status);")
    conn.commit(); cur.close(); conn.close()

# ===== 유틸 =====
def iso(dt: Optional[datetime | date]):
    if not dt: return None
    return dt.isoformat()

def uid(user) -> int:
    # routes_auth.get_current_user 가 객체(예: ORM User)라면 getattr 경로로, dict면 []로
    v = getattr(user, "id", None)
    if v is not None:
        return int(v)
    return int(user["id"])

# ===== 스키마 =====
StatusLiteral = Literal["pending", "answered", "closed"]

class InquiryCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    is_public: Optional[bool] = False

class InquiryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    is_public: Optional[bool] = None
    status: Optional[StatusLiteral] = None  # 필요 시 사용 (일반 사용자는 보통 변경 X)

class InquiryItem(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    status: StatusLiteral
    is_public: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class InquiryBrief(BaseModel):
    id: int
    title: str
    status: StatusLiteral
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    excerpt: Optional[str] = None

class InquiryListResponse(BaseModel):
    count: int
    items: list[InquiryBrief | InquiryItem]

# ===== 엔드포인트 =====

@router.post("", response_model=InquiryItem, status_code=status.HTTP_201_CREATED, summary="문의 작성(본인)")
def create_inquiry(payload: InquiryCreate, user=Depends(get_current_user)):
    init_inquiry_db()
    _uid = uid(user)

    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        INSERT INTO inquiries (user_id, title, content, is_public)
        VALUES (%s, %s, %s, %s)
        RETURNING id, user_id, title, content, status, is_public, created_at, updated_at
    """, (_uid, payload.title.strip(), payload.content.strip(), bool(payload.is_public)))
    row = cur.fetchone()
    conn.commit(); cur.close(); conn.close()

    return InquiryItem(
        id=row[0], user_id=row[1], title=row[2], content=row[3],
        status=row[4], is_public=row[5], created_at=iso(row[6]), updated_at=iso(row[7])
    )

@router.get("", response_model=InquiryListResponse, summary="문의 목록(본인만 보기)")
def list_inquiries(
    mine: bool = Query(True, description="본인만 보기 고정"),
    brief: bool = Query(True, description="간단 응답(발췌 포함)"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user=Depends(get_current_user),
):
    init_inquiry_db()
    if not mine:
        raise HTTPException(status_code=403, detail="Only mine is allowed")

    _uid = uid(user)
    conn = get_conn(); cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM inquiries WHERE user_id=%s", (_uid,))
    total = cur.fetchone()[0] or 0

    cur.execute("""
        SELECT id, user_id, title, content, status, is_public, created_at, updated_at
        FROM inquiries
        WHERE user_id=%s
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s
    """, (_uid, limit, offset))
    rows = cur.fetchall()
    cur.close(); conn.close()

    items = []
    for r in rows:
        _id, _user_id, title, content, status, is_public, created_at, updated_at = r
        if brief:
            excerpt = (content or "").strip().replace("\r\n", " ").replace("\n", " ")
            if len(excerpt) > 80: excerpt = excerpt[:80] + "…"
            items.append(InquiryBrief(
                id=_id, title=title, status=status, created_at=iso(created_at), updated_at=iso(updated_at), excerpt=excerpt
            ))
        else:
            items.append(InquiryItem(
                id=_id, user_id=_user_id, title=title, content=content, status=status,
                is_public=is_public, created_at=iso(created_at), updated_at=iso(updated_at)
            ))

    return InquiryListResponse(count=total, items=items)

@router.get("/{inq_id}", response_model=InquiryItem, summary="문의 단건 조회(본인만)")
def get_inquiry(inq_id: int, user=Depends(get_current_user)):
    init_inquiry_db()
    _uid = uid(user)

    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        SELECT id, user_id, title, content, status, is_public, created_at, updated_at
        FROM inquiries WHERE id=%s
    """, (inq_id,))
    row = cur.fetchone()
    cur.close(); conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    if int(row[1]) != _uid:
        raise HTTPException(status_code=403, detail="Forbidden")

    return InquiryItem(
        id=row[0], user_id=row[1], title=row[2], content=row[3], status=row[4],
        is_public=row[5], created_at=iso(row[6]), updated_at=iso(row[7])
    )

@router.patch("/{inq_id}", response_model=InquiryItem, summary="문의 수정(본인만)")
def update_inquiry(inq_id: int, payload: InquiryUpdate, user=Depends(get_current_user)):
    init_inquiry_db()
    _uid = uid(user)

    conn = get_conn(); cur = conn.cursor()
    # 소유권 확인
    cur.execute("SELECT user_id, status FROM inquiries WHERE id=%s", (inq_id,))
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        raise HTTPException(status_code=404, detail="Not found")
    if int(row[0]) != _uid:
        cur.close(); conn.close()
        raise HTTPException(status_code=403, detail="Forbidden")

    # 업데이트 필드 동적 구성
    sets, vals = [], []
    if payload.title is not None:
        sets.append("title=%s"); vals.append(payload.title.strip())
    if payload.content is not None:
        sets.append("content=%s"); vals.append(payload.content.strip())
    if payload.is_public is not None:
        sets.append("is_public=%s"); vals.append(bool(payload.is_public))
    if payload.status is not None:
        # 필요 시 권한 검사(일반 사용자가 변경 못하게 하려면 여기서 막기)
        sets.append("status=%s"); vals.append(payload.status)

    sets.append("updated_at=now()")

    if len(vals) == 0:
        # 변경 없음 → 현재 값 반환
        cur.execute("""
            SELECT id, user_id, title, content, status, is_public, created_at, updated_at
            FROM inquiries WHERE id=%s
        """, (inq_id,))
        r = cur.fetchone()
        cur.close(); conn.close()
        return InquiryItem(
            id=r[0], user_id=r[1], title=r[2], content=r[3], status=r[4],
            is_public=r[5], created_at=iso(r[6]), updated_at=iso(r[7])
        )

    sql = f"UPDATE inquiries SET {', '.join(sets)} WHERE id=%s RETURNING id, user_id, title, content, status, is_public, created_at, updated_at"
    vals.append(inq_id)
    cur.execute(sql, tuple(vals))
    r = cur.fetchone()
    conn.commit(); cur.close(); conn.close()

    return InquiryItem(
        id=r[0], user_id=r[1], title=r[2], content=r[3], status=r[4],
        is_public=r[5], created_at=iso(r[6]), updated_at=iso(r[7])
    )

@router.delete("/{inq_id}", status_code=status.HTTP_204_NO_CONTENT, summary="문의 삭제(본인만)")
def delete_inquiry(inq_id: int, user=Depends(get_current_user)):
    init_inquiry_db()
    _uid = uid(user)

    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT user_id FROM inquiries WHERE id=%s", (inq_id,))
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        raise HTTPException(status_code=404, detail="Not found")
    if int(row[0]) != _uid:
        cur.close(); conn.close()
        raise HTTPException(status_code=403, detail="Forbidden")

    cur.execute("DELETE FROM inquiries WHERE id=%s", (inq_id,))
    conn.commit(); cur.close(); conn.close()
    return
