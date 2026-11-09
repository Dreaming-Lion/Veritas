import json
exec(open("/work/eval5.py").read().split("ANS =")[0])           # S(dev sheet), REL, NEW_REL, lab, rel(), opp()
S2 = {s["idx"]: s for s in json.load(open("/work/out/sheet2.json"))}
REL2 = {15:[0,1,2,7],16:[0,2,3,6,8],17:list(range(10)),18:[],19:list(range(9)),20:[0,1,2,3,5,6,8],21:[0,1,2,3,4,5,9,10],22:[0,1,2,3,4,8,9,10],23:[0,1,2,3,10,11,12],24:[0,1],25:[0,3,4,5,6],26:[0,1,2,3,4],27:[0,1,2,3,4],28:[],29:[1,2,4]}
NEW2 = [(16,"국정상황실장에 김태근 자치발전비서관 임명"),(17,"법치주의가 사망한 날"),(17,"靑 앞에 간 국힘"),(17,"총선서 李 탄핵할 의석"),(19,"법조 베테랑"),(20,"[점선면]수사를 수사한다는 것"),
        (21,"돌격대장으로"),(21,"세계인이 존경"),(22,"검사들 강력 반발"),(25,"도 넘은"),(25,"멍석말이"),(27,"이해충돌 지적")]
known2 = {(i, r["link"]): (j in REL2[i]) for i, s in S2.items() for j, r in enumerate(s["recs"])}
def isrel(i, r):
    if i < 15: return rel(i, r)
    k = known2.get((i, r["link"]))
    if k is not None: return k
    return any(ii == i and p in r["title"] for ii, p in NEW2)
base_lean = {i: (S[i]["base_lean"] if i in S else S2[i]["base_lean"]) for i in range(30)} if False else {}
for sb in S: base_lean[sb["idx"]] = sb["base_lean"]
for i, s in S2.items(): base_lean[i] = s["base_lean"]
def load(*files):
    out = {}
    for f in files:
        for k in json.load(open(f"/work/out/{f}.json"))["rows"]: out[k["idx"]] = k["recs"][:5]
    return out
def v_from_sheet(name):
    out = {}
    for i in range(30):
        sheet = next(s for s in S if s["idx"] == i) if i < 15 else S2[i]
        top = sorted([(r["in"][name], r) for r in sheet["recs"] if name in r["in"] and r["in"][name] <= 5], key=lambda x: x[0])
        out[i] = [r for _, r in top]
    return out
SYS = {"v1": v_from_sheet("v1"), "v2 원본": v_from_sheet("v2"), "v2+ 임베딩혼합(요약)": {**load("bench8_0.5"), **load("bench9_holdout")},
       "A 질의=본문": load("bench10_qA"), "B 질의·문서=본문": load("bench10_qB")}
def stats(recs, rng):
    n = fit = 0
    for i in rng:
        for r in recs.get(i, []):
            n += 1; fit += isrel(i, r) and opp(base_lean[i], r["lean"])
    return fit, n
ans = {"dev": [], "held": []}
for name, recs in SYS.items():
    pass
anyfit = {i: any(isrel(i, r) and opp(base_lean[i], r["lean"]) for recs in SYS.values() for r in recs.get(i, [])) for i in range(30)}
for label, rng in (("개발15", range(15)), ("독립15", range(15, 30)), ("합계30", range(30))):
    print("==", label, " 정답가능", sum(anyfit[i] for i in rng), "기준기사")
    for name, recs in SYS.items():
        f, n = stats(recs, rng); fa, na = stats(recs, [i for i in rng if anyfit[i]])
        print("  %-22s %3d/%3d (%2.0f%%)  정답가능만 %3d/%3d (%2.0f%%)" % (name, f, n, 100 * f / max(1, n), fa, na, 100 * fa / max(1, na)))
import statistics as st
for f in ("bench10_qA", "bench10_qB"):
    t = [k["sec"] for k in json.load(open(f"/work/out/{f}.json"))["rows"]]; print(f, "time mean %.1f max %.1f" % (st.mean(t), max(t)))
