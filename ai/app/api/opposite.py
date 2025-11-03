# -*- coding: utf-8 -*-
import psycopg2
import pandas as pd
from datetime import timedelta
from fastapi import APIRouter, Query
from summa import summarizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.model.model import nli_infer

router = APIRouter()

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

@router.get("/article/recommend")
def recommend_articles(
    clicked_link: str = Query(..., description="사용자가 클릭한 기사 URL"),
    hours_window: int = Query(48, ge=6, le=168),
    topk_return: int = Query(8, ge=1, le=20),
    nli_threshold: float = Query(0.40, ge=0.0, le=1.0)
):
    conn = get_conn(); cur = conn.cursor()

    # 기준 기사
    cur.execute("""
        SELECT source, lean, title, COALESCE(content, summary, ''), date
        FROM news WHERE link = %s;
    """, (clicked_link,))
    base = cur.fetchone()
    if not base:
        cur.close(); conn.close()
        return {"error":"해당 기사를 찾을 수 없습니다."}

    b_source, b_lean, b_title, b_text, b_date = base
    premise = summarize_text(b_text or b_title, ratio=0.2)

    # 후보: 성향 다른 기사 + 시간창
    params = [b_lean, clicked_link]
    time_sql = ""
    if b_date:
        params = [b_lean, b_date - timedelta(hours=hours_window), b_date + timedelta(hours=hours_window), clicked_link]
        time_sql = "AND date BETWEEN %s AND %s"

    cur.execute(f"""
        SELECT title, COALESCE(content, summary, ''), link, source, lean, date
        FROM news
        WHERE lean != %s
          {time_sql}
          AND link != %s
        ORDER BY date DESC
        LIMIT 1200;
    """, params)
    rows = cur.fetchall()
    cur.close(); conn.close()

    if not rows:
        return {"clicked": clicked_link, "recommendations": []}

    titles = [r[0] for r in rows]
    texts  = [r[1] for r in rows]
    links  = [r[2] for r in rows]
    srcs   = [r[3] for r in rows]
    leans  = [r[4] for r in rows]
    dates  = [r[5] for r in rows]

    # 1차 후보 압축 : TF-IDF 유사도 Top-50 (제목 + 본문 앞부분)
    docs = [ (t or "") + " " + (x[:1500] if x else "") for t, x in zip(titles, texts) ]
    tfidf = TfidfVectorizer(min_df=2, ngram_range=(1,2))
    try:
        X = tfidf.fit_transform([premise] + docs)
        sims = cosine_similarity(X[0], X[1:]).ravel()
    except ValueError:
        sims = [0.0 for _ in docs]

    K = min(50, len(docs))
    cand_idx = sorted(range(len(docs)), key=lambda i: sims[i], reverse=True)[:K]

    # 2차 : NLI로 "반대(contradiction)"만 필터 + 점수화
    picks = []
    for i in cand_idx:
        hyp = summarize_text(texts[i] or titles[i], ratio=0.2)
        label, probs = nli_infer(premise, hyp)
        cprob = probs[2]  # contradiction
        if label == "contradiction" and cprob >= nli_threshold:
            score = float(sims[i]) * (0.8 + 0.2 * cprob)
            picks.append(dict(
                title=titles[i], link=links[i], source=srcs[i], lean=leans[i], date=dates[i],
                probs={"entailment":probs[0], "neutral":probs[1], "contradiction":probs[2]},
                score=score
            ))

    picks.sort(key=lambda x: x["score"], reverse=True)
    return {"clicked": clicked_link, "recommendations": picks[:topk_return]}
