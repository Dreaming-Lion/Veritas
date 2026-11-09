import json, psycopg2
B = json.load(open("/work/out/bench.json"))["rows"]; H = {r["idx"]: r for r in json.load(open("/work/out/bench9_holdout.json"))["rows"]}
c = psycopg2.connect(host="Veritas-db", dbname="appdb", user="appuser", password="apppw").cursor()
def snip(link, n):
    c.execute("select coalesce(summary,content,'') from news where link=%s", (link,)); r = c.fetchone(); return (r[0] if r else "")[:n].replace("\n", " ")
sheet = []
for i in range(15, 30):
    b = B[i]; recs = {}
    for name, lst in (("v1", b["v1_recs"][:5]), ("v2", b["v2_recs"][:5]), ("v2plus", H[i]["recs"][:5])):
        for k, x in enumerate(lst):
            e = recs.setdefault(x["link"], {"title": x["title"], "source": x["source"], "lean": x["lean"], "in": {}})
            e["in"][name] = k + 1
    sheet.append({"idx": i, "base_title": b["base_title"], "base_source": b["source"], "base_lean": b["lean"], "base_snip": snip(b["link"], 200), "recs": [dict(link=l, snip=snip(l, 80), **e) for l, e in recs.items()]})
json.dump(sheet, open("/work/out/sheet2.json", "w"), ensure_ascii=False)
for s in sheet:
    print(f"\n#{s['idx']} [{s['base_source']}/{s['base_lean'][:4]}] {s['base_title']} :: {s['base_snip']}")
    for j, r in enumerate(s["recs"]):
        print(f"  {s['idx']}.{j} [{r['source']}/{(r['lean'] or '?')[:4]}] {r['title']} :: {r['snip']}")
