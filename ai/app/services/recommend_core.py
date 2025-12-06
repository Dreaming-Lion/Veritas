# app/services/recommend_core.py
from __future__ import annotations

import psycopg2
from typing import Optional

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


def summarize_text(text: str, ratio=0.2, hard_cap=600):
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
    if db_lean:
        return db_lean

    src_name = _infer_source_name(source, link)
    if src_name and src_name in LEAN_MAP:
        return LEAN_MAP[src_name]

    return None


def _is_opposite_lean(base: str, cand: str) -> bool:
    if base == "progressive" and cand == "conservative":
        return True
    if base == "conservative" and cand == "progressive":
        return True
    if base == "centrist" and cand in ("progressive", "conservative"):
        return True
    return False


def _fetch_base(cur, clicked_link: str):
    """
    기준 기사 1건 조회.
    - summary 우선, 없으면 content
    """
    normalized = normalize_clicked(clicked_link)
    cur.execute(
        """
        SELECT source,
               lean,
               title,
               COALESCE(summary, content, '') AS text_for_vector,
               date,
               link
        FROM news WHERE link = %s;
        """,
        (normalized,),
    )
    base = cur.fetchone()
    if not base and normalized != clicked_link:
        cur.execute(
            """
            SELECT source,
                   lean,
                   title,
                   COALESCE(summary, content, '') AS text_for_vector,
                   date,
                   link
            FROM news WHERE link = %s;
            """,
            (clicked_link,),
        )
        base = cur.fetchone()
        normalized = clicked_link if base else normalized
    return base, normalized


def compute_recommendations(
    clicked_link: str,
    hours_window: int = 48,
    topk_return: int = 8,
    stance_threshold: float = 0.15,
):
    """
    벡터DB(Qdrant) 기반 반대 의견 추천.

    - TF-IDF 쿼리: 제목 2번 + summary/본문 앞 400자
    - 우선: 반대 lean + stance 절대값이 stance_threshold 이상인 애들만
    - 그런 애들이 없으면 → stance 기준 완화해서 fallback
    """
    from app.services.vector_store import search_similar_with_lean_fallback

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

        short_text = (b_text or "")[:400]
        title_clean = (b_title or "").strip()
        premise_tfidf = f"{title_clean} {title_clean} {short_text}".strip()

        premise_nli = summarize_text(b_text or b_title, ratio=0.2, hard_cap=600) or (b_title or "")
    finally:
        cur.close()
        conn.close()

    hits = search_similar_with_lean_fallback(
        query_text=premise_tfidf,
        base_lean=b_lean,
        base_date=b_date,
        hours_window=hours_window,
        top_k=80,  
    )

    if not hits:
        return {"clicked": normalize_clicked(b_link), "recommendations": []}

    strong_picks = []
    weak_picks = []

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

        hyp = summarize_text(text or title, ratio=0.2, hard_cap=600) or (title or "")
        try:
            label, probs = nli_infer(premise_nli, hyp)
            eprob, nprob, cprob = float(probs[0]), float(probs[1]), float(probs[2])
        except Exception:
            eprob = nprob = cprob = 0.0

        stance = cprob - eprob  # [-1, 1]
        stance_norm = max(0.0, min(1.0, (stance + 1.0) / 2.0))

        is_strong = abs(stance) >= stance_threshold

        base_w, gain_w = 0.8, 0.2
        sim_score = float(h.score or 0.0)
        score = sim_score * (base_w + gain_w * stance_norm)

        out_link = normalize_variant_urls(strip_tracking_params(link or ""))

        item = dict(
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

        if is_strong:
            strong_picks.append(item)
        else:
            weak_picks.append(item)

    strong_picks.sort(key=lambda x: x["score"], reverse=True)
    weak_picks.sort(key=lambda x: x["score"], reverse=True)

    merged: list = strong_picks[:topk_return]
    if len(merged) < topk_return:
        need = topk_return - len(merged)
        merged.extend(weak_picks[:need])

    return {
        "clicked": normalize_clicked(b_link),
        "recommendations": merged,
    }
