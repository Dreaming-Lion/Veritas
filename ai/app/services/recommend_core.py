import psycopg2
from datetime import timedelta
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.model.model import nli_infer
from app.utils.url_normalize import normalize_clicked, strip_tracking_params, normalize_variant_urls
from summa import summarizer

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

def _fetch_base(cur, clicked_link: str):
    normalized = normalize_clicked(clicked_link)
    cur.execute("""
        SELECT source, lean, title, COALESCE(content, summary, ''), date, link
        FROM news WHERE link = %s;
    """, (normalized,))
    base = cur.fetchone()
    if not base and normalized != clicked_link:
        cur.execute("""
            SELECT source, lean, title, COALESCE(content, summary, ''), date, link
            FROM news WHERE link = %s;
        """, (clicked_link,))
        base = cur.fetchone()
        normalized = clicked_link if base else normalized
    return base, normalized

def _fetch_candidates(cur, b_lean, b_date, normalized, hours_window: int):
    if b_date:
        start_dt = b_date - timedelta(hours=hours_window)
        end_dt   = b_date + timedelta(hours=hours_window)
        if b_lean is None:
            cur.execute("""
                SELECT title, COALESCE(content, summary, ''), link, source, lean, date
                FROM news
                WHERE date BETWEEN %s AND %s
                  AND link <> %s
                ORDER BY date DESC
                LIMIT 1200;
            """, (start_dt, end_dt, normalized))
        else:
            cur.execute("""
                SELECT title, COALESCE(content, summary, ''), link, source, lean, date
                FROM news
                WHERE lean IS DISTINCT FROM %s
                  AND date BETWEEN %s AND %s
                  AND link <> %s
                ORDER BY date DESC
                LIMIT 1200;
            """, (b_lean, start_dt, end_dt, normalized))
    else:
        if b_lean is None:
            cur.execute("""
                SELECT title, COALESCE(content, summary, ''), link, source, lean, date
                FROM news
                WHERE link <> %s
                ORDER BY date DESC
                LIMIT 1200;
            """, (normalized,))
        else:
            cur.execute("""
                SELECT title, COALESCE(content, summary, ''), link, source, lean, date
                FROM news
                WHERE lean IS DISTINCT FROM %s
                  AND link <> %s
                ORDER BY date DESC
                LIMIT 1200;
            """, (b_lean, normalized))
    return cur.fetchall()

from urllib.parse import urlparse

NAVER_HOSTS = {"news.naver.com", "n.news.naver.com"}

def compute_recommendations(clicked_link: str,
                            hours_window: int = 48,
                            topk_return: int = 8,
                            stance_threshold: float = 0.15):
    conn = get_conn(); cur = conn.cursor()
    try:
        base, normalized = _fetch_base(cur, clicked_link)
        if not base:
            return {
                "error": "해당 기사를 찾을 수 없습니다.",
                "normalized": normalize_clicked(clicked_link),
            }

        b_source, b_lean, b_title, b_text, b_date, b_link = base


        # TF-IDF용 - 제목 + 본문 일부
        premise_tfidf = f"{b_title or ''} {(b_text or '')[:1500]}".strip()

        # NLI용 - 요약본 
        premise_nli = summarize_text(b_text or b_title, ratio=0.2) or (b_title or "")

        rows = _fetch_candidates(cur, b_lean, b_date, normalized, hours_window)
    finally:
        cur.close(); conn.close()

    if not rows:
        return {"clicked": normalize_clicked(b_link), "recommendations": []}

    titles = [r[0] for r in rows]
    texts  = [r[1] for r in rows]
    links  = [r[2] for r in rows]
    srcs   = [r[3] for r in rows]
    leans  = [r[4] for r in rows]
    dates  = [r[5] for r in rows]

    # TF-IDF 상위 후보
    docs = [(t or "") + " " + ((x or "")[:1500]) for t, x in zip(titles, texts)]
    tfidf = TfidfVectorizer(min_df=2, ngram_range=(1, 2))
    try:
        X = tfidf.fit_transform([premise_tfidf] + docs)
        sims = cosine_similarity(X[0], X[1:]).ravel()
    except ValueError:
        sims = [0.0 for _ in docs]

    K = min(50, len(docs))
    cand_idx = sorted(range(len(docs)), key=lambda i: sims[i], reverse=True)[:K]

    picks = []
    for i in cand_idx:
        hyp = summarize_text(texts[i] or titles[i], ratio=0.2) or (titles[i] or "")
        try:
            label, probs = nli_infer(premise_nli, hyp)
        except Exception:
            continue

        eprob, nprob, cprob = float(probs[0]), float(probs[1]), float(probs[2])
        stance = cprob - eprob  # [-1, 1]
        if stance < stance_threshold:
            continue

        denom = max(1e-6, 1.0 - stance_threshold)
        stance_norm = (stance - stance_threshold) / denom
        stance_norm = 0.0 if stance_norm < 0 else (1.0 if stance_norm > 1 else stance_norm)

        base_w, gain_w = 0.6, 0.4
        score = float(sims[i]) * (base_w + gain_w * stance_norm)

        out_link = normalize_variant_urls(strip_tracking_params(links[i]))
        picks.append(dict(
            title=titles[i],
            link=out_link,
            source=srcs[i],
            lean=leans[i],
            date=dates[i],
            probs={"entailment": eprob, "neutral": nprob, "contradiction": cprob},
            stance=stance,
            score=score
        ))

    picks.sort(key=lambda x: x["score"], reverse=True)
    return {
        "clicked": normalize_clicked(b_link),
        "recommendations": picks[:topk_return]
    }


