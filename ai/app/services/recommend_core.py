import psycopg2
from datetime import timedelta
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.model.model import nli_infer
from app.utils.url_normalize import normalize_clicked, strip_tracking_params, normalize_variant_urls
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

# -------------------- DB fetch --------------------
def _fetch_base(cur, clicked_link: str):
    """
    사용자가 클릭한 링크 기준으로 기준 기사 1건 조회.
    - normalizer를 한 번 적용한 URL, 원본 URL 모두 시도
    """
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

def _fetch_candidates(cur, b_date, normalized, hours_window: int):
    """
    기준 기사(b_date) 주변 시간 창 안에서 다른 기사들을 가져오는 1차 후보 쿼리.
    여기서는 lean 필터를 걸지 않고, 시간/링크 조건만 사용한다.
    정치 성향 기반 필터링은 Python에서 한 번 더 수행.
    """
    if b_date:
        start_dt = b_date - timedelta(hours=hours_window)
        end_dt   = b_date + timedelta(hours=hours_window)
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
            WHERE link <> %s
            ORDER BY date DESC
            LIMIT 1200;
        """, (normalized,))
    return cur.fetchall()

# -------------------- 메인 추천 함수 --------------------
def compute_recommendations(clicked_link: str,
                            hours_window: int = 48,
                            topk_return: int = 8,
                            stance_threshold: float = 0.15):
    """
    1) 사용자가 클릭한 기사(기준 기사)를 찾고, 그 정치 성향(lean)을 추론
    2) 같은 시간 창 안의 다른 기사들을 가져옴
    3) 그 중에서 '정치 성향이 반대인 언론사'의 기사들만 1차 후보로 사용
       - 반대 성향 기사가 없으면 전체 기사 집합으로 fallback
    4) TF-IDF 유사도 상위 K개를 뽑고
    5) mDeBERTa XNLI NLI 모델로 stance 계산
    6) stance + TF-IDF 기반 스코어로 정렬 후 상위 topk_return개 추천
    """
    conn = get_conn(); cur = conn.cursor()
    try:
        base, normalized = _fetch_base(cur, clicked_link)
        if not base:
            return {
                "error": "해당 기사를 찾을 수 없습니다.",
                "normalized": normalize_clicked(clicked_link),
            }

        b_source, b_lean_db, b_title, b_text, b_date, b_link = base

        b_lean = _infer_lean(b_source, b_link, b_lean_db)

        # TF-IDF용 - 제목 + 본문 일부
        premise_tfidf = f"{b_title or ''} {(b_text or '')[:1500]}".strip()

        # NLI용 - 요약본
        premise_nli = summarize_text(b_text or b_title, ratio=0.2) or (b_title or "")

        rows = _fetch_candidates(cur, b_date, normalized, hours_window)
    finally:
        cur.close(); conn.close()

    if not rows:
        return {"clicked": normalize_clicked(b_link), "recommendations": []}

    # 정치 성향 반대 언론사 필터링 
    opposite_rows = []
    others = []

    for r in rows:
        title, text, link, src, lean_db, dt = r
        cand_lean = _infer_lean(src, link, lean_db)

        if b_lean and cand_lean and _is_opposite_lean(b_lean, cand_lean):
            opposite_rows.append(r)
        else:
            others.append(r)

    # 기준 lean이 있고, 반대 성향 기사도 있다면 그것만 사용
    if b_lean and opposite_rows:
        rows_effective = opposite_rows
    else:
        # 반대 lean 기사가 없거나 기준 lean이 없으면 전체 rows로 fallback
        rows_effective = rows

    # TF-IDF + NLI 
    titles = [r[0] for r in rows_effective]
    texts  = [r[1] for r in rows_effective]
    links  = [r[2] for r in rows_effective]
    srcs   = [r[3] for r in rows_effective]
    leans  = [r[4] for r in rows_effective]
    dates  = [r[5] for r in rows_effective]

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
            # 요약된 premise_nli vs hyp로 NLI 추론
            label, probs = nli_infer(premise_nli, hyp)
        except Exception:
            continue

        eprob, nprob, cprob = float(probs[0]), float(probs[1]), float(probs[2])
        stance = cprob - eprob  # [-1, 1]

        # NLI에서 '충돌(contradiction) - 함의(entailment)' 차이가 임계치 이하이면 버림
        if stance < stance_threshold:
            continue

        # stance를 [0, 1]로 정규화
        denom = max(1e-6, 1.0 - stance_threshold)
        stance_norm = (stance - stance_threshold) / denom
        stance_norm = 0.0 if stance_norm < 0 else (1.0 if stance_norm > 1 else stance_norm)

        # TF-IDF 유사도와 stance를 합성해 스코어 계산
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
