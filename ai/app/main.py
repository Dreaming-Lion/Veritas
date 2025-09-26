from fastapi import FastAPI
from app.api.crawl import crawl_news, router as crawl_router
from app.api.opposite import router as recommend_router
# apscheduler는 파이썬에서 일정 관리를 위해 활용하는 라이브러리 !
# 여기서는 주기적으로 뉴스 기사 크롤링 함수를 실행해 DB에 저장하기 위해 활용함.
from apscheduler.schedulers.background import BackgroundScheduler
from app.model.model import load_model

app = FastAPI(title="Veritas AI", version="0.1.0")

def job():
    print("뉴스 크롤링 시작")
    crawl_news()

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(job, "interval", minutes=60)
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
app.include_router(recommend_router, prefix="/api") 