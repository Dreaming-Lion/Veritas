import os, sys, time, json
os.environ["QDRANT_HOST"] = "qdrant"; os.environ["QDRANT_PORT"] = "6333"
sys.path.insert(0, "/repo/ai")
import app.model.model as nm
from app.services import recommend_v2plus as v
from app.services.vector_store import client
nm.load_model(); v.embed(["워밍업"])           # 모델 로딩은 측정 제외
r = {}
t = time.perf_counter(); r["full_first_run"] = v.index_new(); r["full_first_run"]["wall"] = time.perf_counter() - t
n_total = client.count(v.COLL, exact=True).count; r["points_after_full"] = n_total
t = time.perf_counter(); r["noop_run"] = v.index_new(); r["noop_run"]["wall"] = time.perf_counter() - t   # 새 기사 없음
# 새 기사 도착 시뮬레이션: 20건을 인덱스에서 제거 후 증분 실행 (DB 에는 이미 존재)
ids = [p.id for p in client.scroll(v.COLL, limit=20, with_payload=False)[0]]
client.delete(v.COLL, points_selector=ids)
t = time.perf_counter(); r["incremental_20"] = v.index_new(); r["incremental_20"]["wall"] = time.perf_counter() - t
r["incremental_20"]["per_article_sec"] = r["incremental_20"]["wall"] / 20
ids = [p.id for p in client.scroll(v.COLL, limit=1, with_payload=False)[0]]
client.delete(v.COLL, points_selector=ids)
t = time.perf_counter(); r["incremental_1"] = v.index_new(); r["incremental_1"]["wall"] = time.perf_counter() - t
r["count_after_incremental"] = client.count(v.COLL, exact=True).count
t = time.perf_counter(); r["purge_30d"] = v.purge_old(720); r["purge_30d"]["wall"] = time.perf_counter() - t
r["count_after_purge"] = client.count(v.COLL, exact=True).count
# 추천 동작 확인 (정리 전 인덱스로 재색인 후)
v.index_new()   # 삭제된 오래된 기사는 다시 들어오므로 purge 전 상태 비교용으로 전체 재색인
B = json.load(open("/work/out/bench.json"))["rows"]; K = {x["idx"]: x for x in json.load(open("/work/out/bench8_0.5.json"))["rows"]}
same = 0; checked = []
for i in (3, 4, 7, 9, 12):
    out = v.compute_recommendations_v2plus(B[i]["link"])["recommendations"]
    a = [x["link"] for x in out[:5]]; b = [x["link"] for x in K[i]["recs"][:5]]
    checked.append((i, len(set(a) & set(b)), len(a))); same += a == b
r["reco_vs_benchmark_top5"] = checked
json.dump(r, open("/work/out/incremental_test.json", "w"), ensure_ascii=False, indent=1, default=str)
print(json.dumps(r, ensure_ascii=False, indent=1, default=str))
