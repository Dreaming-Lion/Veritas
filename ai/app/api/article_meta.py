from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.briefing import MetaResponse
from app.services.brief_service import (
    build_meta_by_id,
    build_meta_by_link,
)
from app.db.databases import get_db  

router = APIRouter(tags=["article-meta"])


@router.get("/article/{article_id}/meta", response_model=MetaResponse)
async def get_article_meta(
    article_id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await build_meta_by_id(db, article_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Article not found")


@router.get("/article/meta/by-link", response_model=MetaResponse)
async def get_article_meta_by_link(
    link: str = Query(..., description="원문 기사 링크"),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await build_meta_by_link(db, link)
    except ValueError:
        raise HTTPException(status_code=404, detail="Article not found")
