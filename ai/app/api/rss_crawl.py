import html
import re
import time
from datetime import datetime, timedelta, timezone
from dateutil import parser as dtparser
from typing import Optional, List, Dict, Any

import feedparser
import httpx
import psycopg2
from fastapi import APIRouter, HTTPException, Query
from trafilatura import extract as tr_extract
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

from app.ingest.rss_sources import RSS_FEEDS, LEAN

router = APIRouter()

DBCFG = dict(host="Veritas-db", dbname="appdb", user="appuser", password="apppw")

def get_conn():
    return psycopg2.connect(**DBCFG)

def _parse_date(entry):
    for k in ("published", "updated", "pubDate"):
        v = entry.get(k)
        if not v:
            continue
        try:
            dt = dtparser.parse(v)
            if not dt.tzinfo:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            pass
    return None

def _extract_from_rss_entry(entry):
    contents = []
    for c in entry.get("content", []):
        if (c.get("type") or "").startswith("text"):
            contents.append(c.get("value") or "")
    if contents:
        raw = contents[0]
    else:
        raw = entry.get("summary") or entry.get("description") or ""
    raw = html.unescape(raw or "")
    txt = re.sub(r"<.*?>", " ", raw, flags=re.S).strip()
    return txt

def _polite_fetch(url, timeout=12.0):
    headers = {"User-Agent": "VeritasBot/0.1 (+research; contact: dev@example.com)"}
    with httpx.Client(follow_redirects=True, timeout=timeout, headers=headers) as client:
        r = client.get(url)
        r.raise_for_status()
        return r.text

_CANON_RE = re.compile(
    r'<link[^>]+rel=["\']canonical["\'][^>]*href=["\'](?P<href>[^"\']+)["\']',
    re.I
)
_OGURL_RE = re.compile(
    r'<meta[^>]+property=["\']og:url["\'][^>]*content=["\'](?P<href>[^"\']+)["\']',
    re.I
)

def _strip_tracking_params(u: str) -> str:
    try:
        pu = urlparse(u)
        q = [(k, v) for k, v in parse_qsl(pu.query, keep_blank_values=True)
             if not (k.startswith("utm_") or k in {"gclid", "fbclid", "ncid"})]
        cleaned = pu._replace(query=urlencode(q))
        return urlunparse(cleaned)
    except Exception:
        return u

def _canonicalize_url(orig_url: str, html_doc: str) -> str:
    # 1) canonical 태그
    m = _CANON_RE.search(html_doc or "")
    if m:
        return _strip_tracking_params(m.group("href"))
    # 2) og:url
    m = _OGURL_RE.search(html_doc or "")
    if m:
        return _strip_tracking_params(m.group("href"))
    # 3) 추적 파라미터만 제거
    return _strip_tracking_params(orig_url)

def _extract_full(url: str):
    try:
        html_doc = _polite_fetch(url)
        time.sleep(0.8)
        text = tr_extract(html_doc, url=url, include_comments=False, include_tables=False) or ""
        text = text.strip()
        canon = _canonicalize_url(url, html_doc)
        return text, canon
    except Exception:
        return "", _strip_tracking_params(url)

def _upsert(row: dict) -> bool:
    """
    news(link) 고유 제약이 있다고 가정합니다.
    반환값: True면 새 insert, False면 기존 row update
    """
    sql = """
    INSERT INTO news (source, lean, title, summary, content, link, date, author, section, origin)
    VALUES (%(source)s, %(lean)s, %(title)s, %(summary)s, %(content)s, %(link)s, %(date)s, %(author)s, %(section)s, 'rss')
    ON CONFLICT (link) DO UPDATE SET
      title   = EXCLUDED.title,
      summary = COALESCE(NULLIF(EXCLUDED.summary,''), news.summary),
      content = CASE WHEN COALESCE(LENGTH(news.content),0) < COALESCE(LENGTH(EXCLUDED.content),0)
                     THEN EXCLUDED.content ELSE news.content END,
      date    = COALESCE(EXCLUDED.date, news.date),
      source  = EXCLUDED.source,
      lean    = EXCLUDED.lean,
      author  = COALESCE(EXCLUDED.author, news.author),
      section = COALESCE(EXCLUDED.section, news.section)
    RETURNING (xmax = 0) AS inserted;
    """
    conn = get_conn(); cur = conn.cursor()
    cur.execute(sql, row)
    inserted = bool(cur.fetchone()[0])
    conn.commit()
    cur.close(); conn.close()
    return inserted

def crawl_one_feed(source_name: str, feed_url: str) -> Dict[str, Any]:
    d = feedparser.parse(feed_url)
    stats = {
        "source": source_name,
        "processed": 0,
        "inserted": 0,
        "updated": 0,
        "samples": {"inserted": [], "updated": []}
    }
    for e in d.entries:
        raw_link = e.link
        title = (e.title or "").strip()
        date = _parse_date(e)
        author = getattr(e, "author", None)
        section = "politics"
        lean = LEAN.get(source_name, "centrist")

        rss_text = _extract_from_rss_entry(e)
        fulltext, canon_link = _extract_full(raw_link)
        content = fulltext if len(fulltext) >= len(rss_text) else rss_text

        row = dict(
            source=source_name,
            lean=lean,
            title=title,
            summary=rss_text,
            content=content,
            link=canon_link,
            date=date,
            author=author,
            section=section
        )
        inserted = _upsert(row)
        stats["processed"] += 1
        if inserted:
            stats["inserted"] += 1
            if len(stats["samples"]["inserted"]) < 3:
                stats["samples"]["inserted"].append({"title": title, "link": canon_link})
        else:
            stats["updated"] += 1
            if len(stats["samples"]["updated"]) < 3:
                stats["samples"]["updated"].append({"title": title, "link": canon_link})
    return stats

def crawl_rss(sources: Optional[List[str]] = None) -> Dict[str, Any]:
    total = {"processed": 0, "inserted": 0, "updated": 0}
    by_source: Dict[str, Any] = {}
    for src, url in RSS_FEEDS.items():
        if sources and src not in sources:
            continue
        try:
            st = crawl_one_feed(src, url)
            by_source[src] = st
            total["processed"] += st["processed"]
            total["inserted"] += st["inserted"]
            total["updated"] += st["updated"]
        except Exception as ex:
            by_source[src] = {"error": str(ex)}
    return {"total": total, "by_source": by_source}

# -----------------------
# 수동 실행 API
# -----------------------
@router.post("/rss/run")
def run_rss_now(
    sources: Optional[List[str]] = Query(
        default=None,
        description="지정하면 해당 소스만 실행. 예: ?sources=NYTimes&sources=BBC"
    )
):
    return crawl_rss(sources)

@router.post("/rss/run/{source_name}")
def run_one_source_now(source_name: str):
    if source_name not in RSS_FEEDS:
        raise HTTPException(status_code=404, detail=f"unknown source: {source_name}")
    st = crawl_one_feed(source_name, RSS_FEEDS[source_name])
    return {"total": {"processed": st["processed"], "inserted": st["inserted"], "updated": st["updated"]},
            "by_source": {source_name: st}}

# -----------------------
# 결과 확인 API
# -----------------------
@router.get("/rss/stats")
def rss_stats(since_hours: int = 24):
    """
    최근 N시간 기준으로 소스별 개수/최신 기사 시각 집계.
    """
    since_dt = datetime.now(timezone.utc) - timedelta(hours=since_hours)
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        """
        SELECT
            source,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE COALESCE(date, 'epoch'::timestamptz) >= %s) AS within_window,
            MAX(date) AS latest_article_date
        FROM news
        WHERE origin = 'rss'
        GROUP BY source
        ORDER BY source
        """,
        (since_dt,)
    )
    rows = cur.fetchall()
    cur.execute("SELECT MAX(COALESCE(date, 'epoch'::timestamptz)) FROM news WHERE origin='rss'")
    latest_overall = cur.fetchone()[0]
    cur.close(); conn.close()

    return {
        "since": since_dt.isoformat(),
        "by_source": [
            {
                "source": r[0],
                "total": r[1],
                "within_window": r[2],
                "latest_article_date": r[3].isoformat() if r[3] else None
            } for r in rows
        ],
        "latest_article_overall": latest_overall.isoformat() if latest_overall else None
    }

@router.get("/rss/recent")
def rss_recent(
    source: Optional[str] = Query(default=None, description="특정 소스만 보기"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0)
):
    """
    최신 문서 리스트(페이징).
    """
    conn = get_conn(); cur = conn.cursor()
    sql = """
        SELECT source, lean, title, summary, link, date, author, section
        FROM news
        WHERE origin='rss'
    """
    params: List[Any] = []
    if source:
        sql += " AND source = %s"
        params.append(source)

    sql += " ORDER BY COALESCE(date, 'epoch'::timestamptz) DESC NULLS LAST LIMIT %s OFFSET %s"
    params.extend([limit, offset])

    cur.execute(sql, tuple(params))
    rows = cur.fetchall()
    cur.close(); conn.close()

    items = []
    for r in rows:
        items.append({
            "source": r[0],
            "lean": r[1],
            "title": r[2],
            "summary": r[3],
            "link": r[4],
            "date": r[5].isoformat() if r[5] else None,
            "author": r[6],
            "section": r[7]
        })
    return {"count": len(items), "items": items}
