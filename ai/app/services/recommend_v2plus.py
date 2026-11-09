# app/services/recommend_v2plus.py
"""반대 관점 추천 v2+ (벡터 검색 + NLI 재순위의 개선판).

v2(recommend_core + vector_store) 대비 변경점
 1) Qdrant 반대 성향 필터 수정: 시간 조건(must)과 성향 조건(should)을 함께 쓰면 should 가 선택 조건이 되어
    필터가 무력화되던 문제 -> must + MatchAny
 2) 반대 성향 후보가 없을 때 시간 창을 48h -> 7일 -> 30일 순으로 넓히고, 그래도 없으면 같은 성향 기사로 대체(표시)
    (v2 는 폴백 후보를 다시 걸러내 추천이 0건이 되었음)
 3) NLI 는 배치 추론 + 유사도 상위 N(기본 20)개만 재순위 (v2: 건당 추론, 80개)
 4) NLI 가설문(요약)을 인덱싱 시점에 미리 계산해 payload 에 저장
 5) "입장이 뚜렷한 기사를 유사도와 무관하게 앞에 올리던" 정렬 규칙 제거 -> 점수순
 6) TF-IDF 대신 신경망 임베딩(multilingual-e5-small) + 후보 집합 TF-IDF 혼합 점수
 7) 증분 인덱싱: 새 기사만 임베딩해서 upsert, 오래된 기사는 삭제 (180분마다 전체 재구축하지 않음)

RECO_ENGINE=v2plus 환경변수로 켠다 (기본값은 기존 v2).
"""
from __future__ import annotations

import logging
import os
import time
from datetime import timezone

from qdrant_client.http.models import (
    Distance,
    FieldCondition,
    Filter,
    FilterSelector,
    MatchAny,
    PayloadSchemaType,
    PointStruct,
    Range,
    VectorParams,
)

from app.model import nli_fast
from app.services import recommend_core as rc
from app.services.vector_store import _opposite_lean_values, client
from app.utils.url_normalize import (
    normalize_clicked,
    normalize_variant_urls,
    strip_tracking_params,
)

logger = logging.getLogger(__name__)

COLL = os.getenv("V2P_COLLECTION", "news_embed_v2plus")
EMB_MODEL = os.getenv("V2P_EMB_MODEL", "intfloat/multilingual-e5-small")
CHARS = int(os.getenv("V2P_CHARS", "1500"))          # 벡터/로컬 재채점에 쓰는 본문 길이
RETENTION_HOURS = int(os.getenv("V2P_RETENTION_HOURS", "720"))  # 이보다 오래된 기사는 인덱스에서 삭제
NLI_TOP_N = int(os.getenv("V2P_NLI_TOP_N", "20"))
LOCAL_ALPHA = float(os.getenv("V2P_LOCAL_ALPHA", "0.5"))  # 1.0 이면 임베딩 점수만 사용
LOCAL_POOL = int(os.getenv("V2P_LOCAL_POOL", "60"))
# 문서/질의 텍스트 원천: "summary"(요약 우선) | "content"(본문 우선)
DOC_SRC = os.getenv("V2P_DOC_SRC", "summary")
QUERY_SRC = os.getenv("V2P_QUERY_SRC", "summary")

_SQL_TEXT = {
    "summary": "coalesce(nullif(summary,''),content,'')",
    "content": "coalesce(nullif(content,''),summary,'')",
}

_emb = {}


# -------------------------------------------------------------------- 임베딩
def embed(texts, kind: str = "passage", batch: int = 16, max_length: int = 384):
    """multilingual-e5: 문서는 'passage: ', 질의는 'query: ' 접두어. L2 정규화된 벡터 반환."""
    import torch
    import torch.nn.functional as F
    from transformers import AutoModel, AutoTokenizer

    if not _emb:
        _emb["tok"] = AutoTokenizer.from_pretrained(EMB_MODEL)
        _emb["m"] = AutoModel.from_pretrained(EMB_MODEL).eval()
    tok, m = _emb["tok"], _emb["m"]
    out = []
    with torch.inference_mode():
        for i in range(0, len(texts), batch):
            enc = tok(
                [f"{kind}: {t}" for t in texts[i:i + batch]],
                padding=True, truncation=True, max_length=max_length, return_tensors="pt",
            )
            h = m(**enc).last_hidden_state
            mask = enc["attention_mask"].unsqueeze(-1).float()
            v = F.normalize((h * mask).sum(1) / mask.sum(1), dim=-1)
            out.extend(v.tolist())
    return out


# -------------------------------------------------------------------- 증분 인덱싱
def ensure_collection(dim: int = 384):
    names = {c.name for c in client.get_collections().collections}
    if COLL not in names:
        client.create_collection(COLL, vectors_config=VectorParams(size=dim, distance=Distance.COSINE))
    for key, schema in (("date_ts", PayloadSchemaType.INTEGER), ("lean", PayloadSchemaType.KEYWORD)):
        try:
            client.create_payload_index(COLL, field_name=key, field_schema=schema)
        except Exception:  # 이미 있으면 무시
            pass


def _indexed_ids() -> set:
    ids, offset = set(), None
    while True:
        pts, offset = client.scroll(COLL, limit=1000, offset=offset, with_payload=False, with_vectors=False)
        ids.update(int(p.id) for p in pts)
        if offset is None:
            return ids


def index_new(batch: int = 32, limit: int | None = None) -> dict:
    """아직 인덱스에 없는 기사만 임베딩해서 upsert. 최초 실행이면 전체가 대상이 된다."""
    t0 = time.perf_counter()
    ensure_collection()
    done = list(_indexed_ids())

    conn = rc.get_conn()
    cur = conn.cursor()
    try:
        cur.execute(
            f"""
            SELECT id, title, {_SQL_TEXT[DOC_SRC]}, link, source, lean, date
            FROM news
            WHERE link IS NOT NULL AND link <> '' AND id <> ALL(%s)
            ORDER BY id
            {"LIMIT %s" if limit else ""}
            """,
            (done, limit) if limit else (done,),
        )
        rows = cur.fetchall()
    finally:
        cur.close()
        conn.close()

    for s in range(0, len(rows), batch):
        chunk = rows[s:s + batch]
        vecs = embed([(t or "").strip() + " " + (x or "").strip()[:CHARS] for _, t, x, *_ in chunk])
        pts = []
        for (i, t, x, link, src, lean, dt), v in zip(chunk, vecs):
            if dt is not None and dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            pts.append(PointStruct(id=int(i), vector=v, payload={
                "title": t, "link": link, "source": src, "lean": lean,
                "date_ts": int(dt.timestamp()) if dt else None,
                "date": dt.isoformat() if dt else None,
                "body": (x or "")[:CHARS],
                "nli_text": rc.summarize_text(x or t, ratio=0.2, hard_cap=600) or (t or ""),
            }))
        client.upsert(COLL, points=pts)
    sec = time.perf_counter() - t0
    logger.info("[v2plus] index_new: %d건 (%.1fs)", len(rows), sec)
    return {"indexed": len(rows), "seconds": sec}


def purge_old(max_age_hours: int | None = None) -> dict:
    """보관 기간(기본 30일)을 넘긴 기사를 인덱스에서 삭제."""
    ensure_collection()
    hours = max_age_hours if max_age_hours is not None else RETENTION_HOURS
    cutoff = int(time.time()) - hours * 3600
    before = client.count(COLL, exact=True).count
    client.delete(COLL, points_selector=FilterSelector(
        filter=Filter(must=[FieldCondition(key="date_ts", range=Range(lt=cutoff))])))
    after = client.count(COLL, exact=True).count
    return {"purged": before - after, "remaining": after}


def run_incremental() -> dict:
    """크롤링 직후 호출: 새 기사 upsert + 오래된 기사 삭제."""
    res = index_new()
    res.update(purge_old())
    return res


# -------------------------------------------------------------------- 검색 / 추천
def _search(query: str, base_lean, base_date, hours: int, top_k: int):
    q = embed([query], "query")[0]
    must = []
    if base_date is not None:
        d = base_date if base_date.tzinfo else base_date.replace(tzinfo=timezone.utc)
        c = int(d.timestamp())
        must.append(FieldCondition(key="date_ts", range=Range(gte=c - hours * 3600, lte=c + hours * 3600)))
    opp = _opposite_lean_values(base_lean)
    if opp:
        flt = Filter(must=must + [FieldCondition(key="lean", match=MatchAny(any=opp))])
        hits = client.query_points(COLL, query=q, query_filter=flt, limit=top_k, with_payload=True).points
        if hits:
            return hits
    return client.query_points(
        COLL, query=q, query_filter=Filter(must=must) if must else None, limit=top_k, with_payload=True
    ).points


def compute_recommendations_v2plus(
    clicked_link: str,
    hours_window: int = 48,
    topk_return: int = 8,
    stance_threshold: float = 0.15,
):
    """compute_recommendations(v2)와 같은 입출력. 항목에 widened_hours / fallback_same_lean 이 추가된다."""
    conn = rc.get_conn()
    cur = conn.cursor()
    try:
        base, _ = rc._fetch_base(cur, clicked_link)
        if not base:
            return {"error": "해당 기사를 찾을 수 없습니다.", "normalized": normalize_clicked(clicked_link)}
        b_source, b_lean_db, b_title, b_text, b_date, b_link = base
        b_lean = rc._infer_lean(b_source, b_link, b_lean_db)
        cur.execute(f"SELECT {_SQL_TEXT[QUERY_SRC]} FROM news WHERE link=%s", (b_link,))
        r = cur.fetchone()
        q_text = (r[0] if r and r[0] else b_text) or ""
        t = (b_title or "").strip()
        query = f"{t} {t} {q_text[:CHARS]}".strip()
        premise = rc.summarize_text(b_text or b_title, ratio=0.2, hard_cap=600) or (b_title or "")
    finally:
        cur.close()
        conn.close()

    used_hours, fallback = hours_window, False
    cands, raw = [], []
    for hrs in (hours_window, 168, 720):
        hits = _search(query, b_lean, b_date, hrs, top_k=max(NLI_TOP_N * 2, 40, LOCAL_POOL))
        raw = []
        for h in hits:
            p = h.payload or {}
            if p.get("link") == b_link:
                continue
            raw.append((h, p, rc._infer_lean(p.get("source"), p.get("link"), p.get("lean"))))
        cands = [(h, p, cl) for h, p, cl in raw if not (b_lean and cl and not rc._is_opposite_lean(b_lean, cl))]
        used_hours = hrs
        if cands:
            break
    if not cands and raw:  # 어떤 시간 창에도 반대 성향 기사가 없으면 같은 성향 기사로 대체(표시)
        cands, fallback = raw, True
    if not cands:
        return {"clicked": normalize_clicked(b_link), "recommendations": []}

    # 후보 집합 기준 로컬 TF-IDF 재채점을 임베딩 점수와 혼합
    if LOCAL_ALPHA < 1 and len(cands) > 1:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        docs = [f"{p.get('title') or ''} {p.get('title') or ''} {p.get('body') or ''}" for _, p, _ in cands]
        try:
            X = TfidfVectorizer(min_df=2, ngram_range=(1, 2), sublinear_tf=True).fit_transform([query] + docs)
            loc = cosine_similarity(X[0], X[1:]).ravel()
        except ValueError:
            loc = [0.0] * len(cands)
        base_scores = [LOCAL_ALPHA * float(h.score) + (1 - LOCAL_ALPHA) * float(l) for (h, _, _), l in zip(cands, loc)]
    else:
        base_scores = [float(h.score) for h, _, _ in cands]

    order = sorted(range(len(cands)), key=lambda k: -base_scores[k])[:NLI_TOP_N]
    cands = [cands[k] for k in order]
    base_scores = [base_scores[k] for k in order]

    probs = nli_fast.nli_batch(premise, [p.get("nli_text") or p.get("title") for _, p, _ in cands])
    items = []
    for (h, p, cl), (e, n, c), bs in zip(cands, probs, base_scores):
        stance = c - e
        stance_norm = max(0.0, min(1.0, (stance + 1.0) / 2.0))
        items.append(dict(
            title=p.get("title"),
            link=normalize_variant_urls(strip_tracking_params(p.get("link") or "")),
            source=p.get("source"),
            lean=cl,
            date=p.get("date"),
            probs={"entailment": e, "neutral": n, "contradiction": c},
            stance=stance,
            score=bs * (0.8 + 0.2 * stance_norm),
            widened_hours=used_hours if used_hours != hours_window else None,
            fallback_same_lean=fallback,
        ))
    items.sort(key=lambda x: -x["score"])
    return {"clicked": normalize_clicked(b_link), "recommendations": items[:topk_return]}
