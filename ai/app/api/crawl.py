from fastapi import APIRouter, HTTPException, Query
from bs4 import BeautifulSoup
import psycopg2, requests, os, re
from datetime import datetime, date
from html import unescape
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse
from html import unescape as html_unescape

router = APIRouter()

def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS news (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT,
            date TIMESTAMP,
            link TEXT UNIQUE
        )
    """)

    cur.execute("ALTER TABLE news ADD COLUMN IF NOT EXISTS summary TEXT")
    conn.commit()
    cur.close()
    conn.close()

# DB 연결 함수
def get_conn():
    return psycopg2.connect(
        host=os.getenv("PGHOST", "db"), 
        dbname=os.getenv("PGDATABASE", "appdb"),
        user=os.getenv("PGUSER", "appuser"),
        password=os.getenv("PGPASSWORD", "apppw"),
        port=int(os.getenv("PGPORT", "5432")),
    )


UA = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}

def clean_title(txt: str) -> str:
    """따옴표/스마트쿼트 제거 + 공백 정규화 + 노이즈 문자('$', 'quot;' 등) 제거"""
    s = html_unescape((txt or "").strip())
    s = s.replace("&quot;", "").replace("quot;", "")

    s = s.replace("“", "").replace("”", "").replace('"', "")

    s = s.replace("$", "")

    s = re.sub(r"\s+", " ", s)
    return s.strip()

def _strip_tracking(u: str) -> str:
    try:
        pu = urlparse(u)
        q = [
            (k, v)
            for k, v in parse_qsl(pu.query, keep_blank_values=True)
            if not (k.startswith("utm_") or k in {"gclid", "fbclid", "ncid"})
        ]
        return urlunparse(pu._replace(query=urlencode(q)))
    except Exception:
        return u

def normalize_url(u: str) -> str:
    if not u:
        return u
    s = html_unescape(u).replace("&amp;", "&")
    return _strip_tracking(s)

def extract_date(doc: BeautifulSoup) -> str:
    """네이버 기사 날짜 추출 (여러 케이스 대응) → ISO 문자열"""
    date_elem = doc.select_one("div.media_end_head_info_datestamp > div > span")
    if date_elem and date_elem.has_attr("data-date-time"):
        return date_elem["data-date-time"]
    
    t = doc.select_one("time[datetime]")
    if t and t.has_attr("datetime"):
        return t["datetime"]
    
    meta = doc.select_one('meta[property="og:regDate"]')
    if meta and meta.has_attr("content"):
        return meta["content"]

    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _clean_body_noise(text: str) -> str:
    """
    본문은 노이즈 제거하지 말고 '라인 정리'만:
      - HTML 엔티티 해제
      - 줄 단위 트리밍
      - 연속 빈 줄 3줄 이상 → 2줄로 축소
    """
    if not text:
        return ""
    s = html_unescape(text)

    lines = []
    for line in s.splitlines():
        line_strip = line.rstrip()
        lines.append(line_strip)

    s = "\n".join(lines)

    # 빈 줄이 3줄 이상 연속되면 2줄로 정리
    s = re.sub(r"\n{3,}", "\n\n", s)

    # 앞뒤 공백/개행만 정리
    return s.strip()


def extract_article_text(doc: BeautifulSoup) -> str:
    root = (
        doc.select_one("article#dic_area") or
        doc.select_one("#articeBody") or
        doc.select_one("#newsEndContents") or
        doc.select_one(".newsct_article") or
        doc
    )

    for sel in ["script", "style", "figure", "table", "iframe", "noscript", "button", "svg", "form", "aside"]:
        for tag in root.select(sel):
            tag.decompose()

    for br in root.find_all("br"):
        br.replace_with("\n\n")

    blocks = []
    for node in root.find_all(["p", "h2", "h3", "h4", "li", "blockquote"]):
        txt = node.get_text(" ", strip=True)
        if not txt:
            continue
        if node.name == "li":
            txt = f"• {txt}"
        blocks.append(txt)

    if blocks:
        text = "\n\n".join(blocks)
    else:
        text = root.get_text("\n\n", strip=True)

    text = _clean_body_noise(text)
    return text


# 크롤링
@router.get("/article/crawl")
def crawl_news():
    init_db()

    url = "https://news.naver.com/section/100"
    res = requests.get(url, headers=UA, timeout=10)
    soup = BeautifulSoup(res.text, "html.parser")

    collected = []
    for item in soup.select("div.sa_text"):
        a = item.select_one("a.sa_text_title")
        if not a:
            continue
        title = clean_title(a.get_text(strip=True))
        link = normalize_url(a.get("href", ""))

        if not link:
            continue

        news_res = requests.get(link, headers=UA, timeout=10)
        news_html = BeautifulSoup(news_res.text, "html.parser")

        content_text = extract_article_text(news_html)
        news_date = extract_date(news_html)
        collected.append((title, content_text, news_date, link))

    conn = get_conn()
    cur = conn.cursor()
    inserted_ids = []

    for title, content, news_date, link in collected:
        # 이미 같은 link가 있으면 크롤링 안함
        cur.execute(
            """
            INSERT INTO news (title, content, date, link)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (link) DO NOTHING
            RETURNING id
            """,
            (title, content, news_date, link),
        )
        row = cur.fetchone()
        if row:
            inserted_ids.append(row[0])

    conn.commit()
    cur.close()
    conn.close()

    # 새로 들어간 기사(id)가 있을 때만 요약 webhook 호출
    if inserted_ids:
        try:
            base = os.getenv("SELF_BASE", "http://localhost:8000")
            requests.post(
                f"{base}/api/webhook/crawl-complete",
                json={"ids": inserted_ids, "force": False},
                timeout=5,
            )
        except Exception as e:
            print(f"[crawl] summary webhook call failed: {e}")

    return {"count": len(collected), "inserted": len(inserted_ids), "ids": inserted_ids}


# 기사 목록 조회
@router.get("/article")
def get_news(limit: int = 50, offset: int = 0):
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, title, content, summary, date, link
        FROM news
        ORDER BY date DESC NULLS LAST
        LIMIT %s OFFSET %s
        """,
        (limit, offset),
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    arts = []
    for _id, title, content, summary, dt, link in rows:
        arts.append(
            {
                "id": _id,
                "title": clean_title(title or ""),
                "content": content or "",
                "summary": summary or "",
                "date": dt.isoformat() if dt else None,
                "link": link or "",
            }
        )
    return {"count": len(arts), "articles": arts}


@router.get("/article/{article_id:int}")
def get_article(article_id: int):
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, title, content, summary, date, link
        FROM news
        WHERE id = %s
        LIMIT 1
        """,
        (article_id,),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="article not found")

    _id, title, content, summary, dt, link = row
    return {
        "id": _id,
        "title": clean_title(title or ""),
        "content": content or "",
        "summary": summary or "",
        "date": dt.isoformat() if isinstance(dt, (datetime, date)) else None,
        "link": link or "",
    }


@router.get("/article/by-link")
def get_article_by_link(link: str = Query(..., description="원문 링크(URL)")):
    init_db()
    raw = link
    norm = html_unescape(raw).replace("&amp;", "&")
    stripped = _strip_tracking(norm)

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, title, content, date, link
        FROM news
        WHERE link = %s OR link = %s OR link = %s
        LIMIT 1
        """,
        (raw, norm, stripped),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="article not found")

    _id, title, content, dt, link_val = row
    return {
        "id": _id,
        "title": clean_title(title or ""),
        "content": (content or ""),
        "date": dt.isoformat() if dt else None,
        "link": link_val or "",
    }


@router.get("/article/meta/by-link")
def get_article_meta_by_link(link: str = Query(...)):
    return {"claim": None, "opposing": None, "bill": None, "briefing": None}


@router.get("/article/{article_id:int}/meta")
def get_article_meta_by_id(article_id: int):
    return {"claim": None, "opposing": None, "bill": None, "briefing": None}
