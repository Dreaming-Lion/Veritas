import os, sys, time, json, random, platform
sys.path.insert(0, "/repo/ai"); sys.path.insert(0, "/work/v1")
os.environ["PGHOST"] = "Veritas-db"; os.environ["QDRANT_HOST"] = "qdrant"; os.environ["QDRANT_PORT"] = "6333"
M = int(os.environ.get("M", "40"))
import psycopg2, torch
import app.model.model as nm
from app.services import recommend_core as v2core
import recommend_core_v1 as v1core
from app.services import vector_store as vs
from app.api import article_reco as ar

# NLI call counter / timer, patched in both versions
stat = {"n": 0, "sec": 0.0}
_orig = nm.nli_infer
def wrapped(p, h):
    t = time.perf_counter(); r = _orig(p, h)
    stat["n"] += 1; stat["sec"] += time.perf_counter() - t
    return r
v1core.nli_infer = wrapped; v2core.nli_infer = wrapped

def reset(): stat["n"] = 0; stat["sec"] = 0.0

nm.load_model(); _orig("워밍업 문장입니다.", "워밍업 가설입니다.")  # warm-up (not measured)

conn = v2core.get_conn(); cur = conn.cursor()
cur.execute("select count(*) from news"); n_news = cur.fetchone()[0]

# ---- v2 index build (full rebuild, as scheduled job does) ----
t = time.perf_counter(); idx = vs.train_vectorizer_and_index_all(); index_sec = time.perf_counter() - t
print("index", idx, index_sec, flush=True)
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    dim = len(vs.load_vectorizer().vocabulary_)
except Exception: dim = None

cur.execute("""select link, lean, source from news
               where lean is not null and date is not null and length(coalesce(content,''))>200
                 and coalesce(summary,'')<>''""")
elig = cur.fetchall()
random.seed(42); random.shuffle(elig)
bases = elig[:M]
print("eligible", len(elig), "sample", len(bases), flush=True)

rows = []
for i, (link, lean, src) in enumerate(bases):
    rec = {"link": link, "lean": lean, "source": src}
    # v1 cold (no cache): compute + upsert to article_reco
    reset(); t = time.perf_counter(); r1 = v1core.compute_recommendations(link, 48, 8, 0.15)
    rec["v1_cold_sec"] = time.perf_counter() - t; rec["v1_nli_n"] = stat["n"]; rec["v1_nli_sec"] = stat["sec"]
    if "recommendations" in r1:
        t = time.perf_counter()
        ar._upsert_cache(link, 48, 8, 0.15, r1.get("clicked") or link, r1)
        rec["v1_upsert_sec"] = time.perf_counter() - t
        t = time.perf_counter(); c = ar._get_cache(link, 48, 8, 0.15)
        rec["v1_cachehit_sec"] = time.perf_counter() - t
    # v2 (vector search + NLI rerank)
    reset(); t = time.perf_counter(); r2 = v2core.compute_recommendations(link, 48, 8, 0.15)
    rec["v2_sec"] = time.perf_counter() - t; rec["v2_nli_n"] = stat["n"]; rec["v2_nli_sec"] = stat["sec"]
    # search only + similarity-only ranking (ablation, no NLI)
    base, _ = v2core._fetch_base(cur, link)
    b_source, b_lean_db, b_title, b_text, b_date, b_link = base
    q = f"{(b_title or '').strip()} {(b_title or '').strip()} {(b_text or '')[:400]}".strip()
    b_lean = v2core._infer_lean(b_source, b_link, b_lean_db)
    t = time.perf_counter()
    hits = vs.search_similar_with_lean_fallback(query_text=q, base_lean=b_lean, base_date=b_date, hours_window=48, top_k=80)
    rec["v2_search_only_sec"] = time.perf_counter() - t; rec["v2_hits"] = len(hits)
    sim = []
    for h in hits:
        p = h.payload or {}
        cl = v2core._infer_lean(p.get("source"), p.get("link"), p.get("lean"))
        if b_lean and cl and not v2core._is_opposite_lean(b_lean, cl): continue
        sim.append({"title": p.get("title"), "link": p.get("link"), "source": p.get("source"), "lean": cl, "sim": float(h.score)})
    rec["sim_only"] = sim[:8]
    def slim(r):
        return [{k: x.get(k) for k in ("title","link","source","lean","stance","score")} for x in r.get("recommendations", [])]
    rec["v1_recs"] = slim(r1); rec["v2_recs"] = slim(r2)
    rec["base_title"] = b_title; rec["base_text"] = (b_text or "")[:500]
    rows.append(rec)
    print(i, round(rec["v1_cold_sec"],1), round(rec["v2_sec"],1), len(rec["v1_recs"]), len(rec["v2_recs"]), flush=True)
    json.dump({"rows": rows}, open("/work/out/bench_partial.json", "w"), ensure_ascii=False)

meta = {"n_news": n_news, "index_sec": index_sec, "index_n": idx.get("indexed"), "tfidf_dim": dim,
        "cpu": platform.processor() or platform.machine(), "cores": os.cpu_count(), "torch": torch.__version__,
        "torch_threads": torch.get_num_threads(), "eligible": len(elig), "M": len(bases)}
json.dump({"meta": meta, "rows": rows}, open("/work/out/bench.json", "w"), ensure_ascii=False, indent=1)
print("DONE", meta)
