from datetime import datetime
from sqlalchemy import Integer, ForeignKey, UniqueConstraint, Index, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.databases import Base

class Bookmark(Base):
    __tablename__ = "bookmarks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    article_id: Mapped[int] = mapped_column(Integer, nullable=False)  # FK(articles.id)라면 ForeignKey로 바꿔도 OK
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "article_id", name="uq_bookmarks_user_article"),
        Index("ix_bookmarks_user_id_created_at", "user_id", "created_at"),
    )
