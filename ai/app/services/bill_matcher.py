# app/services/bill_matcher.py
from datetime import datetime
from typing import List, Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.schemas.briefing import BillDoc, BillInfo


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


def _build_bill_text(
    bill: BillDoc,
    max_len: int = 1000,
) -> str:
    """
    발의 법안 메타 정보들을 한 덩어리의 텍스트로 만든다.
    (법안명, 소관위, 제안자, 처리상태 등)
    """
    parts = [
        bill.name or "",
        bill.committee or "",
        bill.proposer or "",
        bill.status or "",
    ]
    text = "\n".join(filter(None, (p.strip() for p in parts)))
    if len(text) > max_len:
        text = text[:max_len]
    return text.strip()


def pick_best_bill(
    article_title: str,
    article_body: str,
    article_date: datetime,     
    candidates: List[BillDoc],
    min_sim: float = 0.1,
) -> Optional[BillInfo]:
    """
    - 기사(타이틀 + 본문 일부)를 쿼리로 사용
    - 발의 법안의 메타 텍스트를 TF-IDF 문서로 사용
    - 코사인 유사도가 가장 높은 법안을 찾고, min_sim 미만이면 None
    """
    if not candidates:
        return None

    # 쿼리 텍스트 생성
    query_text = _build_query_text(article_title, article_body)

    # 법안 메타 텍스트 생성
    docs_text: List[str] = [_build_bill_text(c) for c in candidates]

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
        sims = [0.0 for _ in docs_text]

    if not len(sims):
        return None

    best_idx = int(sims.argmax())
    best_sim = float(sims[best_idx])

    if best_sim < min_sim:
        return None

    best = candidates[best_idx]

    # summary
    brief_parts = []
    if best.committee:
        brief_parts.append(f"{best.committee} 소관")
    if best.proposer:
        brief_parts.append(f"제안자: {best.proposer}")
    if best.status:
        brief_parts.append(f"처리상태: {best.status}")

    brief = " / ".join(brief_parts) if brief_parts else "국회의원 발의 법률안입니다."

    return BillInfo(
        name=best.name,
        number=best.bill_no,
        status=best.status or "알 수 없음",
        brief=brief,
        url=best.detail_link,
    )
