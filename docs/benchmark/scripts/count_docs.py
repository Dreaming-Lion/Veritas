"""법안·브리핑 문서 수 집계. 팀이 본인 API 키로 실행하세요 (키는 코드에 넣지 말고 환경변수로).
  NA_BILL_KEY, GOV_POLICY_NEWS_KEY, GOV_PRESS_RELEASE_KEY, GOV_SPEECH_KEY
실행 예: python count_docs.py   (저장소 ai/ 가 PYTHONPATH에 있어야 함)
"""
import asyncio, os
from datetime import datetime, timezone, timedelta
from app.services.bill_service import fetch_bills_around
from app.services import brief_service

async def main():
    now = datetime.now(timezone(timedelta(hours=9)))
    bills = await fetch_bills_around(now, days_before=365, days_after=0, max_pages=50)
    print("법안(최근 1년, 21대 국회 API):", len(bills))
    for name in dir(brief_service):
        if name.startswith("fetch") and name != "fetch":
            print("brief_service 함수:", name)
    print("브리핑 수집 함수명을 위에서 확인해 호출하세요(정책뉴스/보도자료/연설문 각각 건수).")

asyncio.run(main())
