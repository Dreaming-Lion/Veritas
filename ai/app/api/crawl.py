from fastapi import APIRouter
from bs4 import BeautifulSoup
import psycopg2, requests, re
from datetime import datetime

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
        host="Veritas-db",
        dbname="appdb",
        user="appuser",
        password="apppw"
    )

@router.get("/article/crawl")
def crawl_news():
    url = "https://news.naver.com/section/100"
    res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}) # Header -> ConnectionError 방지
    soup = BeautifulSoup(res.text, "html.parser") # HTML 파싱

    articles = []
    for item in soup.select("div.sa_text"):
        title = item.select_one("a.sa_text_title").get_text(strip=True)
        link = item.select_one("a.sa_text_title")["href"]

        news_res = requests.get(link, headers={"User-Agent": "Mozilla/5.0"})
        news_html = BeautifulSoup(news_res.text, "html.parser")

        content = news_html.select("article#dic_area")
        if not content:
            content = news_html.select("#articeBody")
        content = ''.join(str(content))
        content = re.sub('<[^>]*>', '', content)

        try:
            date_elem = news_html.select_one(
                "div.media_end_head_info_datestamp > div > span"
            )
            news_date = date_elem["data-date-time"]
        except:
            news_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        articles.append((title, content, news_date, link))

    conn = get_conn()
    cur = conn.cursor()
    for title, content, news_date, link in articles:
        cur.execute("""
            INSERT INTO news (title, content, date, link)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (link) DO NOTHING
        """, (title, content, news_date, link))
    conn.commit() # DB에 결과 저장
    cur.close()
    conn.close()

    return {"count": len(articles), "articles": articles}

@router.get("/article")
def get_news():
    conn = get_conn() # DB 연결
    cur = conn.cursor() # 커서 생성 -> 결과는 Result Set 형식으로 쌓임.
    cur.execute("SELECT title, content, date, link FROM news ORDER BY date DESC") # title, content, date, link 출력
    # cur.fetchone() : 결과 집합에서 맨 위의 한 행만 가져옴.
    # cur.fetchmany(size) : 결과 집합에서 size 개수만큼 행 가져옴.
    rows = cur.fetchall() # 결과 집합의 남아 있는 모든 행을 가져옴. (각 row는 튜플 형태)
    cur.close()
    conn.close()

    # JSON 변환
    news_list = []
    for row in rows:
        news_list.append({
            "title": row[0],
            "content": row[1],
            "date": row[2],
            "link": row[3]
        })

    return {"count": len(news_list), "articles": news_list}
