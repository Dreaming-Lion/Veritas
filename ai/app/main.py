from fastapi import FastAPI
from app.api.crawl import crawl_news, router as crawl_router
from app.api.opposite import router as recommend_router
from app.api.rss_crawl import crawl_rss, router as rss_router
from app.api.crawl import router as article_router
# apscheduler는 파이썬에서 일정 관리를 위해 활용하는 라이브러리 !
# 여기서는 주기적으로 뉴스 기사 크롤링 함수를 실행해 DB에 저장하기 위해 활용함.
from apscheduler.schedulers.background import BackgroundScheduler
from app.model.model import load_model
from fastapi.middleware.cors import CORSMiddleware
from app.api.summary import router as summary_router, run_summary_after_crawl
from app.db.databases import Base as AuthBase, engine as auth_engine
from app.api.routes_auth import router as auth_router

app = FastAPI(title="Veritas AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def job_naver():
    print("네이버 뉴스 크롤링 시작")
    try:
        crawl_news() 
    finally:
        print("요약 작업 시작")
        run_summary_after_crawl(limit=500)

def job_rss():
    print("RSS 뉴스 크롤링 시작")
    crawl_rss()

def start_scheduler():
    scheduler = BackgroundScheduler()
    AuthBase.metadata.create_all(bind=auth_engine)
    scheduler.add_job(job_naver, "interval", minutes=60, id="naver_job", max_instances=1, coalesce=True)
    scheduler.add_job(job_rss, "interval", minutes=60, id="rss_job",   max_instances=1, coalesce=True)
    scheduler.start()

@app.on_event("startup")
def on_startup():
    from app.api.crawl import init_db
    init_db()
    start_scheduler()
    load_model()

@app.get("/")
async def root():
    return {"message": "Veritas API에 오신 것을 환영합니다!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

app.include_router(crawl_router, prefix="/api")
app.include_router(rss_router, prefix="/api")
app.include_router(recommend_router, prefix="/api")
app.include_router(summary_router,  prefix="/api")
app.include_router(article_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
