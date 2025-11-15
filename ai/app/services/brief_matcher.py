# app/services/brief_matcher.py
from datetime import datetime
from typing import List, Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.schemas.briefing import GovDoc, BriefingInfo


def _build_query_text(
    title: str,
    body: str,
    max_len: int = 1500,
) -> str:
    """
    기사 타이틀 + 본문 일부를 이어붙여 쿼리 텍스트 생성.
    """
    t = (title or "").strip()
    b = (body or "").strip()
    if len(b) > max_len:
        b = b[:max_len]
    return (t + "\n" + b).strip()


def _build_doc_text(doc: GovDoc, max_len: int = 2000) -> str:
    """
    정부 문서(GovDoc)의 제목 + 본문 일부를 하나의 문자열로 만든다.
    """
    title = (doc.title or "").strip()
    body = (doc.body or "").strip()
    if len(body) > max_len:
        body = body[:max_len]
    return (title + "\n" + body).strip()


def pick_best_briefing(
    article_title: str,
    article_body: str,
    article_date: datetime,    
    candidates: List[GovDoc],
    min_sim: float = 0.1,
) -> Optional[BriefingInfo]:
    """
    - 기사(타이틀 + 본문 일부)를 쿼리로 사용
    - 정부 문서(GovDoc)의 제목 + 본문을 TF-IDF 문서로 사용
    - 코사인 유사도가 가장 높은 문서를 찾고, min_sim 미만이면 None
    """
    if not candidates:
        return None

    # 쿼리 텍스트 생성
    query_text = _build_query_text(article_title, article_body)

    # 각 정부 문서 텍스트 생성
    docs_text: List[str] = [_build_doc_text(c) for c in candidates]

    # TF-IDF + 코사인 유사도
    vect = TfidfVectorizer(
        max_features=5000,
        min_df=2,
        ngram_range=(1, 2),
    )
    try:
        X = vect.fit_transform([query_text] + docs_text)
        sims = cosine_similarity(X[0:1], X[1:]).flatten()
    except ValueError:
        # 토큰이 거의 없거나 전부 비어 있는 경우 등
        sims = [0.0 for _ in docs_text]

    if not len(sims):
        return None

    best_idx = int(sims.argmax())
    best_sim = float(sims[best_idx])

    # 최소 유사도 미만이면 매칭 실패 처리
    if best_sim < min_sim:
        return None

    best_doc = candidates[best_idx]

    # summary
    snippet = (best_doc.body or "").strip()
    if len(snippet) > 300:
        snippet = snippet[:300] + "..."

    return BriefingInfo(
        dept=best_doc.minister or "정부",
        date=best_doc.approve_datetime.strftime("%Y-%m-%d %H:%M"),
        title=best_doc.title,
        summary=snippet,
        url=best_doc.original_url,
    )
