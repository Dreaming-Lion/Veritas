# ai/app/services/brief_matcher.py
from datetime import datetime
from typing import List, Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from summa import summarizer

from app.schemas.briefing import GovDoc, BriefingInfo


def summarize_text(text: str, ratio: float = 0.2, hard_cap: int = 1200) -> str:
    text = (text or "").strip()
    if not text:
        return ""
    try:
        s = summarizer.summarize(text, ratio=ratio)
        if s and s.strip():
            return s[:hard_cap]
    except Exception:
        pass
    return text[:hard_cap]


def _build_query_text(
    title: str,
    body: str,
    max_len: int = 1000,
) -> str:
    t = (title or "").strip()
    b = (body or "").strip()
    if len(b) > max_len:
        b = b[:max_len]
    return (t + "\n" + b).strip()


def pick_best_briefing(
    article_title: str,
    article_body: str,
    article_date: datetime,
    candidates: List[GovDoc],
    min_sim: float = 0.1,
) -> Optional[BriefingInfo]:
    if not candidates:
        return None

    # 기사 요약
    article_body_sum = summarize_text(
        article_body or article_title, ratio=0.2, hard_cap=1200
    )
    query_text = _build_query_text(article_title, article_body_sum)

    # 후보 문서 요약 + 비교 텍스트 생성
    docs_text: List[str] = []
    for c in candidates:
        body_sum = summarize_text(c.body or c.title, ratio=0.2, hard_cap=1200)
        if not body_sum:
            body_sum = (c.body or c.title or "")
        docs_text.append((c.title or "") + "\n" + body_sum)

    # TF-IDF + 코사인 유사도
    vect = TfidfVectorizer(max_features=5000, min_df=2, ngram_range=(1, 2))
    try:
        X = vect.fit_transform([query_text] + docs_text)
        sims = cosine_similarity(X[0:1], X[1:]).flatten()
    except ValueError:
        sims = [0.0 for _ in docs_text]

    if not sims.size:
        return None

    best_idx = int(sims.argmax())
    best_sim = float(sims[best_idx])

    if best_sim < min_sim:
        return None

    best_doc = candidates[best_idx]

    full_snippet = summarize_text(
        best_doc.body or best_doc.title, ratio=0.25, hard_cap=600
    )
    snippet = full_snippet.strip() or (
        (best_doc.body[:300] + "...") if best_doc.body else ""
    )

    return BriefingInfo(
        dept=best_doc.minister or "정부",
        date=best_doc.approve_datetime.strftime("%Y-%m-%d %H:%M"),
        title=best_doc.title,
        summary=snippet,
        url=best_doc.original_url,
    )
