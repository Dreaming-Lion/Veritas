# main.py
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from app.api.crawl import crawl_news, router as crawl_router, init_db
from app.api.rss_crawl import crawl_rss, router as rss_router
from app.api.crawl import router as article_router
from app.api.summary import router as summary_router, run_summary_after_crawl
from app.services.recommend_batch import precompute_recent
from app.model.model import load_model
from app.api import article_reco, article_ready
from app.db.databases import Base as AuthBase, engine as auth_engine  # 남겨둠(추후 마이그레이션 등)
from app.api.routes_auth import router as auth_router
from app.db.init_db import init_db_2
from app.api.bookmarks import router as bookmarks_router
from app.api.inquiries import router as inquiries_router
from app.api.article_meta import router as article_meta_router

BOOTSTRAP_DO_CRAWL   = os.getenv("BOOTSTRAP_DO_CRAWL", "1") == "1"
BOOTSTRAP_LOOKBACK_H = int(os.getenv("BOOTSTRAP_LOOKBACK_H", "720"))
BOOTSTRAP_MAX_ITEMS  = int(os.getenv("BOOTSTRAP_MAX_ITEMS", "1000"))
SUMMARY_LIMIT_AFTER_CRAWL = int(os.getenv("SUMMARY_LIMIT_AFTER_CRAWL", "1000"))
QUICK_BOOT = os.getenv("QUICK_BOOT", "1") == "1"

app = FastAPI(title="Veritas AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = BackgroundScheduler(timezone="UTC")


def job_crawl_all():
    print("[job_crawl_all] 네이버 뉴스 크롤링 시작")
    try:
        crawl_news()
        print("[job_crawl_all] RSS 뉴스 크롤링 시작")
        crawl_rss()
    finally:
        print("[job_crawl_all] 요약 작업 시작")
        run_summary_after_crawl(limit=SUMMARY_LIMIT_AFTER_CRAWL)

        print(f"[job_crawl_all] 추천 사전계산 시작(24h/최대400)")
        precompute_recent(lookback_hours=24, max_items=400)
        print("[job_crawl_all] 추천 사전계산 완료")


def job_reco_periodic():
    """
    최근 72시간 기준으로 추천 캐시 리프레시
    """
    print("[job_reco_periodic] 주기적 추천 사전 계산(72h/최대600)")
    precompute_recent(lookback_hours=72, max_items=600)


def start_scheduler_once():
    if getattr(app.state, "sched_started", False):
        print("[scheduler] already started; skip")
        return

    scheduler.add_job(
        job_crawl_all,
        "interval",
        minutes=180,
        id="crawl_all_job",
        max_instances=1,
        coalesce=True,
    )

    scheduler.add_job(
        job_reco_periodic,
        "interval",
        minutes=30,
        id="reco_job",
        max_instances=1,
        coalesce=True,
    )

    scheduler.start()
    app.state.sched_started = True
    print("[scheduler] started")


def bootstrap_heavy_jobs():
    print("[bootstrap] heavy bootstrap start")
    try:
        if BOOTSTRAP_DO_CRAWL:
            print("[bootstrap] 초기 크롤 + 요약 + 추천(job_crawl_all) 실행")
            job_crawl_all()
        else:
            print("[bootstrap] 초기 크롤 생략(BOOTSTRAP_DO_CRAWL=0)")

        print(f"[bootstrap] 추가 추천 사전계산 시작({BOOTSTRAP_LOOKBACK_H}h/최대{BOOTSTRAP_MAX_ITEMS})")
        precompute_recent(lookback_hours=BOOTSTRAP_LOOKBACK_H, max_items=BOOTSTRAP_MAX_ITEMS)
        print("[bootstrap] 추천 사전계산 완료")
    except Exception as e:
        import traceback
        print("[bootstrap] ERROR:", e)
        traceback.print_exc()
    finally:
        print("[bootstrap] heavy bootstrap done")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[startup] init_db & ensure_cache_table")
    init_db()
    init_db_2()
    article_reco.ensure_cache_table()

    print("[startup] load_model")
    if QUICK_BOOT:
        scheduler.add_job(
            load_model,
            "date",
            run_date=datetime.now(timezone.utc) + timedelta(seconds=1),
            id="load_model_once",
            coalesce=True,
        )
    else:
        load_model()

    start_scheduler_once()

    scheduler.add_job(
        bootstrap_heavy_jobs,
        "date",
        run_date=datetime.now(timezone.utc) + timedelta(seconds=2),
        id="bootstrap_once",
        coalesce=True,
    )
    yield
    print("[shutdown] done")

app.router.lifespan_context = lifespan



@app.get("/")
async def root():
    return {"message": "Veritas API에 오신 것을 환영합니다!"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

app.include_router(crawl_router,   prefix="/api")
app.include_router(rss_router,     prefix="/api")
app.include_router(article_router, prefix="/api")
app.include_router(summary_router, prefix="/api")
app.include_router(article_reco.router, prefix="/api")
app.include_router(article_ready.router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(bookmarks_router, prefix="/api")
app.include_router(inquiries_router, prefix="/api")
app.include_router(article_meta_router, prefix="/api")
