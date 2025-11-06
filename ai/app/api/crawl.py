from fastapi import APIRouter
from bs4 import BeautifulSoup
import psycopg2, requests, re, os
from datetime import datetime, date

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


@router.get("/article/crawl")
def crawl_news():
    init_db()

    url = "https://news.naver.com/section/100"
    res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(res.text, "html.parser")

    articles = []
    for item in soup.select("div.sa_text"):
        a = item.select_one("a.sa_text_title")
        if not a:
            continue
        title = a.get_text(strip=True)
        link = a.get("href", "")

        news_res = requests.get(link, headers={"User-Agent": "Mozilla/5.0"})
        news_html = BeautifulSoup(news_res.text, "html.parser")

        content_el = news_html.select_one("article#dic_area") or news_html.select_one("#articeBody")
        content_text = content_el.get_text(" ", strip=True) if content_el else ""

        news_date = None
        date_elem = news_html.select_one("div.media_end_head_info_datestamp > div > span")
        if date_elem and date_elem.has_attr("data-date-time"):
            news_date = date_elem["data-date-time"]
        if not news_date:
            news_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

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

@router.get("/article")
def get_news(limit: int = 50, offset: int = 0):
    init_db()  

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT title, content, date, link
        FROM news
        ORDER BY date DESC NULLS LAST 
        LIMIT %s OFFSET %s
    """, (limit, offset))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    articles = []
    for title, content, dt, link in rows:
        if isinstance(dt, (datetime, date)):
            dt_str = dt.isoformat()
        else:
            dt_str = None

        articles.append({
            "title": title or "",
            "content": content or "",
            "date": dt_str,
            "link": link or "",
        })

    return {"count": len(articles), "articles": articles}