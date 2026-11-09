import os, sys, json, time
sys.path.insert(0, "/repo/ai")
os.environ["PGHOST"] = "Veritas-db"
from concurrent.futures import ThreadPoolExecutor
import psycopg2
from app.ingest.rss_sources import RSS_FEEDS
from app.api import rss_crawl

DDL = """
CREATE TABLE IF NOT EXISTS public.news (id bigserial PRIMARY KEY);
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS source text, ADD COLUMN IF NOT EXISTS lean text,
  ADD COLUMN IF NOT EXISTS title text, ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS content text, ADD COLUMN IF NOT EXISTS link text,
  ADD COLUMN IF NOT EXISTS "date" timestamptz, ADD COLUMN IF NOT EXISTS author text,
  ADD COLUMN IF NOT EXISTS section text, ADD COLUMN IF NOT EXISTS origin text DEFAULT 'rss';
CREATE UNIQUE INDEX IF NOT EXISTS news_link_unique ON public.news (link);
"""
conn = psycopg2.connect(host="Veritas-db", dbname="appdb", user="appuser", password="apppw")
cur = conn.cursor(); cur.execute(DDL); conn.commit()

t0 = time.time()
def one(item):
    name, url = item
    ts = time.time()
    try:
        st = rss_crawl.crawl_one_feed(name, url)
        return name, {"processed": st["processed"], "inserted": st["inserted"], "sec": round(time.time()-ts,1)}
    except Exception as e:
        return name, {"error": str(e)[:200]}
with ThreadPoolExecutor(14) as ex:
    res = dict(ex.map(one, RSS_FEEDS.items()))
crawl_sec = time.time() - t0
print("crawl done", crawl_sec, flush=True)

t1 = time.time()
from app.api.summary import run_summary_after_crawl
try:
    s = run_summary_after_crawl(limit=60000, force=True)
except Exception as e:
    s = {"error": repr(e)}
sum_sec = time.time() - t1
print("summary", s, sum_sec, flush=True)

cur.execute("select source, lean, count(*), count(*) filter (where coalesce(summary,'')<>''), min(date), max(date), round(avg(length(content))) from news group by 1,2 order by 1")
rows = [list(map(str, r)) for r in cur.fetchall()]
cur.execute("select count(*), min(date), max(date) from news")
tot = list(map(str, cur.fetchone()))
json.dump({"crawl_sec": crawl_sec, "summary_sec": sum_sec, "summary_result": str(s), "per_feed": res,
           "by_source": rows, "total": tot}, open("/work/out/collect.json", "w"), ensure_ascii=False, indent=1)
print(tot)
