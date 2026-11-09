import os, sys, time, json
sys.path.insert(0, "/repo/ai"); sys.path.insert(0, "/work/v2plus")
os.environ["PGHOST"] = "Veritas-db"; os.environ["QDRANT_HOST"] = "qdrant"; os.environ["QDRANT_PORT"] = "6333"
import app.model.model as nm
import v2plus, nli_fast
nm.load_model(); nli_fast.nli_batch("워밍업", ["워밍업"] * 4)
v2plus.DENSE = os.environ.get("DENSE","0")=="1"
v2plus.QSRC = os.environ.get("QSRC") or None
v2plus.SRC = os.environ.get("SRC", "content"); v2plus.CHARS = int(os.environ.get("CH", "1500"))
IDX = eval(os.environ.get("IDX", "list(range(15))")); OUT = os.environ.get("OUT", "bench5")
n, sec = v2plus.build_index_plus(); print("index", n, sec, flush=True)
B = json.load(open("/work/out/bench.json"))["rows"]; rows = []
for i in IDX:
    t = time.perf_counter(); out = v2plus.compute_plus(B[i]["link"], nli_top_n=20, strong_first=os.environ.get("SF","0")=="1", local_alpha=float(os.environ.get("LA","0.5"))); dt = time.perf_counter() - t
    rows.append({"idx": i, "sec": dt, "recs": [{k: x.get(k) for k in ("title", "link", "source", "lean", "widened_hours")} for x in out.get("recommendations", [])]})
    print(i, round(dt, 1), len(rows[-1]["recs"]), flush=True)
json.dump({"rows": rows}, open(f"/work/out/{OUT}.json", "w"), ensure_ascii=False)
