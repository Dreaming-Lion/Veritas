# app/services/recommend_batch.py
from __future__ import annotations

from app.services.vector_store import train_vectorizer_and_index_all


def build_full_tfidf_index() -> dict:
    """
    news 전체를 대상으로 TF-IDF vectorizer 학습 및 Qdrant 인덱싱
    """
    res = train_vectorizer_and_index_all()
    return res
