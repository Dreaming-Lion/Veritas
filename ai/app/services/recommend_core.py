# app/services/recommend_core.py
from __future__ import annotations

import psycopg2
from datetime import timedelta
from typing import Optional, Tuple

from sklearn.feature_extraction.text import TfidfVectorizer  # 여전히 summarize용에 필요하면 유지

from app.model.model import nli_infer
from app.utils.url_normalize import (
    normalize_clicked,
    strip_tracking_params,
    normalize_variant_urls,
)
from summa import summarizer

from urllib.parse import urlparse

DBCFG = dict(host="Veritas-db", dbname="appdb", user="appuser", password="apppw")


def get_conn():
    return psycopg2.connect(**DBCFG)


def summarize_text(text: str, ratio=0.2, hard_cap=1200):
    text = (text or "").strip()
    if not text:
        return text
    try:
        s = summarizer.summarize(text, ratio=ratio)
        if s and s.strip():
            return s[:hard_cap]
    except Exception:
        pass
    return text[:hard_cap]


LEAN_MAP = {
    # 진보
    "오마이뉴스": "progressive",
    "한겨레": "progressive",
    "프레시안": "progressive",
    "경향신문": "progressive",
    "JTBC": "progressive",
    # 보수
    "조선일보": "conservative",
    "동아일보": "conservative",
    "매일경제": "conservative",
    "국민일보": "conservative",
    "시사저널": "conservative",
    # 중도
    "뉴시스": "centrist",
    "서울신문": "centrist",
    "SBS": "centrist",
    "연합뉴스TV": "centrist",
}


def _infer_source_name(source: str | None, link: str | None) -> str | None:
    """
    DB에 저장된 source가 없으면 URL host를 기반으로 언론사 이름을 추정.
    - RSS_FEEDS 에서 사용 중인 도메인 패턴 기준으로 매핑
    """
    if source and source.strip():
        return source.strip()

    if not link:
        return None

    try:
        host = (urlparse(link).hostname or "").lower()
    except Exception:
        return None

    if host.startswith("www."):
        host = host[4:]

    if "yonhapnewstv.co.kr" in host:
        return "연합뉴스"
    if "ohmynews.com" in host:
        return "오마이뉴스"
    if "chosun.com" in host:
        return "조선일보"
    if "jtbc.co.kr" in host:
        return "JTBC"
    if "sbs.co.kr" in host:
        return "SBS"
    if "mk.co.kr" in host:
        return "매일경제"
    if "hani.co.kr" in host:
        return "한겨레"
    if "pressian.com" in host:
        return "프레시안"
    if "sisajournal.com" in host:
        return "시사저널"
    if "seoul.co.kr" in host:
        return "서울신문"
    if "donga.com" in host:
        return "동아일보"
    if "newsis.com" in host:
        return "뉴시스"
    if "kmib.co.kr" in host:
        return "국민일보"
    if "khan.co.kr" in host:
        return "경향신문"

    return None


def _infer_lean(source: str | None, link: str | None, db_lean: str | None) -> str | None:
    """
    우선순위:
      1) news.lean (DB에 이미 저장돼 있으면 그대로 사용)
      2) news.source + URL host 기반으로 LEAN_MAP에서 추론
    """
    if db_lean:
        return db_lean

    src_name = _infer_source_name(source, link)
    if src_name and src_name in LEAN_MAP:
        return LEAN_MAP[src_name]

    return None


def _is_opposite_lean(base: str, cand: str) -> bool:
    """
    base 기사와 cand 기사의 정치 성향이 '반대'인지 판별.
    - progressive <-> conservative
    - centrist 는 진보/보수 모두와 대비되는 기사로 취급
    """
    if base == "progressive" and cand == "conservative":
        return True
    if base == "conservative" and cand == "progressive":
        return True
    if base == "centrist" and cand in ("progressive", "conservative"):
        return True
    return False


def _fetch_base(cur, clicked_link: str):
    """
    사용자가 클릭한 링크 기준으로 기준 기사 1건 조회.
    - normalizer를 한 번 적용한 URL, 원본 URL 모두 시도
    """
    normalized = normalize_clicked(clicked_link)
    cur.execute(
        """
        SELECT source, lean, title, COALESCE(content, summary, ''), date, link
        FROM news WHERE link = %s;
        """,
        (normalized,),
    )
    base = cur.fetchone()
    if not base and normalized != clicked_link:
        cur.execute(
            """
            SELECT source, lean, title, COALESCE(content, summary, ''), date, link
            FROM news WHERE link = %s;
            """,
            (clicked_link,),
        )
        base = cur.fetchone()
        normalized = clicked_link if base else normalized
    return base, normalized


from app.services.vector_store import search_similar_with_lean_fallback


def compute_recommendations(
    clicked_link: str,
    hours_window: int = 48,
    topk_return: int = 8,
    stance_threshold: float = 0.15,
):
    """
    벡터DB(Qdrant) 기반 추천 버전.

    1) 사용자가 클릭한 기사(기준 기사)를 찾고, 그 정치 성향(lean)을 추론
    2) 기준 기사 텍스트를 TF-IDF 쿼리 벡터로 만들고
    3) Qdrant에서 '시간창 + (가능하면) 반대 lean' 조건으로 유사 기사 Top-K 검색
       - search_similar_with_lean_fallback 안에서:
         - 반대 lean만 우선 시도
         - 없으면 lean 제한 없이 전체에서 검색
    4) 후보들에 대해 mDeBERTa XNLI NLI 모델로 stance 계산
    5) stance + TF-IDF(Cosine) 기반 스코어로 정렬 후 상위 topk_return개 추천
    """
    conn = get_conn()
    cur = conn.cursor()
    try:
        base, normalized = _fetch_base(cur, clicked_link)
        if not base:
            return {
                "error": "해당 기사를 찾을 수 없습니다.",
                "normalized": normalize_clicked(clicked_link),
            }

        b_source, b_lean_db, b_title, b_text, b_date, b_link = base
        b_lean = _infer_lean(b_source, b_link, b_lean_db)

        premise_tfidf = f"{b_title or ''} {(b_text or '')[:1500]}".strip()

        premise_nli = summarize_text(b_text or b_title, ratio=0.2) or (b_title or "")
    finally:
        cur.close()
        conn.close()

    hits = search_similar_with_lean_fallback(
        query_text=premise_tfidf,
        base_lean=b_lean,
        base_date=b_date,
        hours_window=hours_window,
        top_k=50,
    )

    if not hits:
        return {"clicked": normalize_clicked(b_link), "recommendations": []}

    picks = []
    for h in hits:
        payload = h.payload or {}
        link = payload.get("link")
        src = payload.get("source")
        lean_db = payload.get("lean")
        title = payload.get("title")
        text = payload.get("content", "")
        date_iso = payload.get("date")

        cand_lean = _infer_lean(src, link, lean_db)

        if b_lean and cand_lean and not _is_opposite_lean(b_lean, cand_lean):
            continue

        hyp = summarize_text(text or title, ratio=0.2) or (title or "")
        try:
            label, probs = nli_infer(premise_nli, hyp)
            eprob, nprob, cprob = float(probs[0]), float(probs[1]), float(probs[2])
        except Exception:
            eprob = nprob = cprob = 0.0

        stance = cprob - eprob  # [-1, 1]
        stance_norm = max(0.0, min(1.0, (stance + 1.0) / 2.0))

        base_w, gain_w = 0.8, 0.2
        sim_score = float(h.score or 0.0)
        score = sim_score * (base_w + gain_w * stance_norm)

        out_link = normalize_variant_urls(strip_tracking_params(link or ""))

        picks.append(
            dict(
                title=title,
                link=out_link,
                source=src,
                lean=cand_lean,
                date=date_iso,
                probs={
                    "entailment": eprob,
                    "neutral": nprob,
                    "contradiction": cprob,
                },
                stance=stance,
                score=score,
            )
        )

    picks.sort(key=lambda x: x["score"], reverse=True)
    return {
        "clicked": normalize_clicked(b_link),
        "recommendations": picks[:topk_return],
    }
