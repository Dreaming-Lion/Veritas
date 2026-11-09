import json, statistics as st
S = json.load(open("/work/out/sheet2.json")); B = json.load(open("/work/out/bench.json"))["rows"]
REL = {15:[0,1,2,7],16:[0,2,3,6,8],17:list(range(10)),18:[],19:list(range(9)),20:[0,1,2,3,5,6,8],21:[0,1,2,3,4,5,9,10],
       22:[0,1,2,3,4,8,9,10],23:[0,1,2,3,10,11,12],24:[0,1],25:[0,3,4,5,6],26:[0,1,2,3,4],27:[0,1,2,3,4],28:[],29:[1,2,4]}
def opp(b, c): return (b, c) in {("progressive","conservative"),("conservative","progressive"),("centrist","progressive"),("centrist","conservative")}
agg = {s: dict(n=0, fit=0, rel=0, hit=0, empty=0, fa=0, na=0) for s in ("v1","v2","v2plus")}
pat = {}
for sb in S:
    i = sb["idx"]; pat[i] = {}
    for s in agg:
        top = sorted([(r["in"][s], j, r) for j, r in enumerate(sb["recs"]) if s in r["in"] and r["in"][s] <= 5], key=lambda x: x[0])
        fit = [(j in REL[i]) and opp(sb["base_lean"], r["lean"]) for _, j, r in top]
        a = agg[s]; a["n"] += len(top); a["fit"] += sum(fit); a["rel"] += sum(1 for _, j, r in top if j in REL[i]); a["hit"] += any(fit); a["empty"] += not top
        pat[i][s] = (sum(fit), len(top))
ans = [i for i in pat if any(pat[i][s][0] for s in agg)]
print("held-out 15 bases")
for s, a in agg.items(): print(s, "returned", a["n"], "fit", a["fit"], "(%.0f%%)" % (100*a["fit"]/max(1,a["n"])), "bases hit", a["hit"], "empty", a["empty"])
print("answerable", ans)
for s in agg:
    f = sum(pat[i][s][0] for i in ans); n = sum(pat[i][s][1] for i in ans); print(s, "answerable fit %d/%d (%.0f%%)" % (f, n, 100*f/max(1,n)))
for i in pat: print(i, {s: pat[i][s] for s in agg})
H = json.load(open("/work/out/bench9_holdout.json"))["rows"]; t = sorted(r["sec"] for r in H); k = (len(t)-1)*.95; f = int(k)
print("v2+ dense hybrid time mean %.1f p95 %.1f" % (st.mean(t), t[f]+(t[min(f+1,len(t)-1)]-t[f])*(k-f)))
v1 = [B[i]["v1_cold_sec"] for i in range(15,30)]; v2 = [B[i]["v2_sec"] for i in range(15,30)]
print("v1 mean %.1f v2 mean %.1f" % (st.mean(v1), st.mean(v2)), "v2 empty", sum(1 for i in range(15,30) if not B[i]["v2_recs"]))
import csv
with open("/work/out/label_sheet_heldout.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f); w.writerow(["base_idx","base_source","base_lean","base_title","rec_idx","rec_source","rec_lean","rec_title","rec_link","rank_in_systems","llm_relevant","llm_opposite_fit","human_label(팀 검수)"])
    for sb in S:
        for j, r in enumerate(sb["recs"]):
            rl = j in REL[sb["idx"]]
            w.writerow([sb["idx"], sb["base_source"], sb["base_lean"], sb["base_title"], j, r["source"], r["lean"], r["title"], r["link"], "|".join(f"{k}:{v}" for k, v in r["in"].items()), int(rl), int(rl and opp(sb["base_lean"], r["lean"])), ""])
