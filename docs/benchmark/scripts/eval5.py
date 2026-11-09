import json, sys
exec(open("/work/analyze.py").read().split("agg =")[0])
NEW_REL = {(0, "북 확성기 소음 재개될라"), (3, "檢수사는 안 되고"), (3, "與, 조작기소 특검법 오늘 처리"), (3, "[단독] “李 공소취소"),
           (7, "‘조작기소 특검’ 파견검사"), (7, "167대 1"), (12, "이용철 ‘성남라인’ 비판에 방어"), (0, "[현장]“1년 지났지만"), (3, "공소취소, 특검법에 조항"), (7, "법무장관 발표 2시간 뒤"), (3, "토요일 광화문 집회"), (7, "공소취소, 특검법에 조항"), (7, "국회 쿠데타"), (7, "연일 비판")}
KEEP = {"bench8_1.0": "DENSE e5 only", "bench8_0.5": "DENSE e5 + local tfidf 0.5", "bench7_0.5": "hybrid a=0.5", "bench7_0.0": "local only a=0.0", "bench6": "v2+ (요약, 1500자, 유사도순 정렬)", "bench4": "v2+ (요약 기반, 1500자)", "bench5": "v2+ (본문 기반, 1500자)"}
lab = {(sb["idx"], r["link"]): (j in REL[sb["idx"]]) for sb in S for j, r in enumerate(sb["recs"])}
def rel(i, r):
    l = lab.get((i, r["link"]))
    if l is not None: return l
    return any(p in r["title"] for (ii, p) in NEW_REL if ii == i)
ANS = (3, 4, 7, 9, 10, 11, 12)
for f, name in KEEP.items():
    K = json.load(open(f"/work/out/{f}.json"))["rows"]
    fit = n = fa = na = 0
    for k in K:
        i = k["idx"]; base = S[i]["base_lean"]
        for r in k["recs"][:5]:
            ok = rel(i, r) and opp(base, r["lean"]); fit += ok; n += 1
            if i in ANS: fa += ok; na += 1
    print(name, "전체 %d/%d (%.0f%%)  정답가능7건 %d/%d (%.0f%%)" % (fit, n, 100 * fit / n, fa, na, 100 * fa / na))
