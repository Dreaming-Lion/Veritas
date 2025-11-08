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
    conn.commit()
    cur.close()
    conn.close()

# DB 연결 함수
def get_conn():
    # psycopg2는 PostgreSQL에서 데이터베이스 연결에 쓰이는 드라이버 라이브러리
    # cur = conn.cursor()  : 커서 생성 (테이블 조작을 위해 생성)
    # psycopg2.connect(...) : PostgreSQL 데이터베이스에 연결하기 위해 사용하는 함수
    # cur.execute(Query) : 테이블 생성, 데이터 삽입, 쿼리 실행 등 작업을 위해 사용하는 함수
    # conn.commit() : 커밋 (DB 저장)
    # cur.close(); conn.close(); # 연결 종료
    return psycopg2.connect(
        host=os.getenv("PGHOST", "db"),          # 기본: db (compose 서비스명)
        dbname=os.getenv("PGDATABASE", "appdb"),
        user=os.getenv("PGUSER", "appuser"),
        password=os.getenv("PGPASSWORD", "apppw"),
        port=int(os.getenv("PGPORT", "5432")),
    )

# 유틸
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"}

def clean_title(txt: str) -> str:
    """따옴표/스마트쿼트 제거 + 공백 정규화"""
    s = html_unescape((txt or "").strip())
    s = s.replace("“", "").replace("”", "").replace('"', "")
    s = re.sub(r"\s+", " ", s)
    return s

def _strip_tracking(u: str) -> str:
    """utm, gclid 등 트래킹 파라미터 제거"""
    try:
        pu = urlparse(u)
        q = [(k, v) for k, v in parse_qsl(pu.query, keep_blank_values=True)
             if not (k.startswith("utm_") or k in {"gclid", "fbclid", "ncid"})]
        return urlunparse(pu._replace(query=urlencode(q)))
    except Exception:
        return u

def normalize_url(u: str) -> str:
    """HTML 엔티티 → 실제 문자, 트래킹 파라미터 제거"""
    if not u:
        return u
    s = html_unescape(u).replace("&amp;", "&")
    return _strip_tracking(s)

def extract_date(doc: BeautifulSoup) -> str:
    """네이버 기사 날짜 추출 (여러 케이스 대응) → ISO 문자열"""
    # 1) data-date-time 속성
    date_elem = doc.select_one("div.media_end_head_info_datestamp > div > span")
    if date_elem and date_elem.has_attr("data-date-time"):
        return date_elem["data-date-time"]
    # 2) time 태그의 datetime
    t = doc.select_one("time[datetime]")
    if t and t.has_attr("datetime"):
        return t["datetime"]
    # 3) meta og:regDate
    meta = doc.select_one('meta[property="og:regDate"]')
    if meta and meta.has_attr("content"):
        return meta["content"]
    # fallback: 지금 시간
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

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

    text = html_unescape(text)
    text = re.sub(r"[ \t\u00A0]+", " ", text)
    return text.strip()


# 크롤링
@router.get("/article/crawl")
def crawl_news():
    init_db()

    url = "https://news.naver.com/section/100"
    res = requests.get(url, headers=UA, timeout=10)
    soup = BeautifulSoup(res.text, "html.parser")

    articles = []
    for item in soup.select("div.sa_text"):
        a = item.select_one("a.sa_text_title")
        if not a:
            continue

        title = clean_title(a.get_text(strip=True))
        link = normalize_url(a.get("href", ""))

        # 본문 페이지
        news_res = requests.get(link, headers=UA, timeout=10)
        news_html = BeautifulSoup(news_res.text, "html.parser")

        content_text = extract_article_text(news_html)
        news_date = extract_date(news_html)

        articles.append((title, content_text, news_date, link))

    conn = get_conn()
    cur = conn.cursor()
    for title, content, news_date, link in articles:
        cur.execute("""
            INSERT INTO news (title, content, date, link)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (link) DO NOTHING
        """, (title, content, news_date, link))
    conn.commit()
    cur.close()
    conn.close()

    return {"count": len(articles), "articles": articles}

# 기사 조회
@router.get("/article")
def get_news(limit: int = 50, offset: int = 0):
    init_db()
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        SELECT id, title, content, date, link
        FROM news
        ORDER BY date DESC NULLS LAST
        LIMIT %s OFFSET %s
    """, (limit, offset))
    rows = cur.fetchall()
    cur.close(); conn.close()

    articles = []
    for _id, title, content, dt, link in rows:
        articles.append({
            "id": _id,
            "title": clean_title(title or ""),
            "content": (content or ""),
            "date": dt.isoformat() if dt else None,
            "link": link or "",
        })
    return {"count": len(articles), "articles": articles}

@router.get("/article/{article_id}")
def get_article(article_id: int):
    init_db()
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        SELECT id, title, content, date, link
        FROM news
        WHERE id = %s
        LIMIT 1
    """, (article_id,))
    row = cur.fetchone()
    cur.close(); conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="article not found")

    _id, title, content, dt, link = row
    return {
        "id": _id,
        "title": clean_title(title or ""),
        "content": (content or ""),
        "date": dt.isoformat() if isinstance(dt, (datetime, date)) else None,
        "link": link or "",
    }

@router.get("/article/by-link")
def get_article_by_link(link: str = Query(..., description="원문 링크(URL)")):
    init_db()
    raw = link
    norm = html_unescape(raw).replace("&amp;", "&")
    stripped = _strip_tracking(norm)

    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        SELECT id, title, content, date, link
        FROM news
        WHERE link = %s OR link = %s OR link = %s
        LIMIT 1
    """, (raw, norm, stripped))
    row = cur.fetchone()
    cur.close(); conn.close()

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

# 링크 연결
@router.get("/article/meta/by-link")
def get_article_meta_by_link(link: str = Query(...)):
    return {"claim": None, "opposing": None, "bill": None, "briefing": None}

@router.get("/article/{article_id}/meta")
def get_article_meta_by_id(article_id: int):
    return {"claim": None, "opposing": None, "bill": None, "briefing": None}
