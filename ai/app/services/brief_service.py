# ai/app/services/brief_service.py
import os
import re
import asyncio
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any

import httpx
import xmltodict
import psycopg2
from psycopg2.extras import DictCursor

from app.schemas.briefing import GovDoc, MetaResponse
from app.services.brief_matcher import pick_best_briefing

DBCFG = dict(
    host=os.getenv("DB_HOST", "Veritas-db"),
    dbname=os.getenv("POSTGRES_DB", "appdb"),
    user=os.getenv("POSTGRES_USER", "appuser"),
    password=os.getenv("POSTGRES_PASSWORD", "apppw"),
)

def get_conn():
    return psycopg2.connect(**DBCFG)

GOV_POLICY_NEWS_KEY = os.getenv("GOV_POLICY_NEWS_KEY", "")
GOV_PRESS_RELEASE_KEY = os.getenv("GOV_PRESS_RELEASE_KEY", "")
GOV_SPEECH_KEY = os.getenv("GOV_SPEECH_KEY", "")

POLICY_NEWS_URL = (
    "http://apis.data.go.kr/1371000/policyNewsService/policyNewsList"
)
PRESS_RELEASE_URL = (
    "http://apis.data.go.kr/1371000/pressReleaseService/pressReleaseList"
)
SPEECH_URL = "http://apis.data.go.kr/1371000/speechService/speechList"


def _get_service_key_for(url: str) -> str:
    if "policyNewsService" in url:
        return GOV_POLICY_NEWS_KEY
    if "pressReleaseService" in url:
        return GOV_PRESS_RELEASE_KEY
    if "speechService" in url:
        return GOV_SPEECH_KEY
    return ""


def _strip_html(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _parse_datetime(dt_str: str) -> datetime:
    """
    ApproveDate: '09/27/2021 17:48:00' 같은 포맷 (KST로 간주)
    """
    if not dt_str:
        return datetime.now(timezone.utc)

    for fmt in ("%m/%d/%Y %H:%M:%S", "%m/%d/%Y %H:%M"):
        try:
            dt = datetime.strptime(dt_str, fmt)
            return dt.replace(tzinfo=timezone(timedelta(hours=9)))
        except ValueError:
            continue

    return datetime.now(timezone.utc)


def _ensure_list(x):
    if x is None:
        return []
    if isinstance(x, list):
        return x
    return [x]


async def _fetch_xml(url: str, start: datetime, end: datetime) -> List[dict]:
    service_key = _get_service_key_for(url)
    if not service_key:
        return []

    params = {
        "serviceKey": service_key,
        "startDate": start.strftime("%Y%m%d"),
        "endDate": end.strftime("%Y%m%d"),
        "numOfRows": 1000,
        "pageNo": 1,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
    data = xmltodict.parse(r.text)

    try:
        items = data["response"]["body"]["items"]["item"]
    except KeyError:
        return []

    return _ensure_list(items)


async def fetch_policy_news(start: datetime, end: datetime) -> List[GovDoc]:
    items = await _fetch_xml(POLICY_NEWS_URL, start, end)
    docs: List[GovDoc] = []
    for it in items:
        approve = _parse_datetime(it.get("ApproveDate", ""))
        body = _strip_html(it.get("DataContents", "") or "")
        docs.append(
            GovDoc(
                source_type="policy_news",
                news_item_id=str(it.get("NewsItemId", "")),
                title=it.get("Title", ""),
                body=body,
                approve_datetime=approve,
                minister=it.get("MinisterCode", ""),
                original_url=it.get("OriginalUrl", None),
            )
        )
    return docs


async def fetch_press_release(start: datetime, end: datetime) -> List[GovDoc]:
    items = await _fetch_xml(PRESS_RELEASE_URL, start, end)
    docs: List[GovDoc] = []
    for it in items:
        approve = _parse_datetime(it.get("ApproveDate", ""))
        body = _strip_html(it.get("DataContents", "") or "")
        docs.append(
            GovDoc(
                source_type="press_release",
                news_item_id=str(it.get("NewsItemId", "")),
                title=it.get("Title", ""),
                body=body,
                approve_datetime=approve,
                minister=it.get("MinisterCode", ""),
                original_url=it.get("OriginalUrl", None),
            )
        )
    return docs


async def fetch_speeches(start: datetime, end: datetime) -> List[GovDoc]:
    items = await _fetch_xml(SPEECH_URL, start, end)
    docs: List[GovDoc] = []
    for it in items:
        approve = _parse_datetime(it.get("ApproveDate", ""))
        body = _strip_html(it.get("DataContents", "") or "")
        docs.append(
            GovDoc(
                source_type="speech",
                news_item_id=str(it.get("NewsItemId", "")),
                title=it.get("Title", ""),
                body=body,
                approve_datetime=approve,
                minister=it.get("MinisterCode", ""),
                original_url=it.get("OriginalUrl", None),
            )
        )
    return docs


async def fetch_all_gov_docs_around(
    article_dt: datetime,
    days_before: int = 7,
    days_after: int = 3,
) -> List[GovDoc]:
    """
    기사 날짜 기준으로 앞뒤 일정 기간의 정책뉴스/보도자료/연설문을 모두 가져온다.
    """
    start = (article_dt - timedelta(days=days_before)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    end = (article_dt + timedelta(days=days_after)).replace(
        hour=23, minute=59, second=59, microsecond=0
    )

    policy, press, speech = await asyncio.gather(
        fetch_policy_news(start, end),
        fetch_press_release(start, end),
        fetch_speeches(start, end),
    )
    return [*policy, *press, *speech]


def _fetch_article_by_id_sync(article_id: int) -> Optional[Dict[str, Any]]:
    """
    news 테이블에서 id 기준으로 기사 1건 조회.
    - id, title, content/summary, date, link 만 사용.
    """
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=DictCursor) as cur:
            cur.execute(
                """
                SELECT id,
                       title,
                       COALESCE(content, summary, '') AS body,
                       date,
                       link
                FROM news
                WHERE id = %s;
                """,
                (article_id,),
            )
            row = cur.fetchone()
            if not row:
                return None
            return dict(row)
    finally:
        conn.close()


def _fetch_article_by_link_sync(link: str) -> Optional[Dict[str, Any]]:
    """
    news 테이블에서 link 기준으로 기사 1건 조회.
    """
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=DictCursor) as cur:
            cur.execute(
                """
                SELECT id,
                       title,
                       COALESCE(content, summary, '') AS body,
                       date,
                       link
                FROM news
                WHERE link = %s;
                """,
                (link,),
            )
            row = cur.fetchone()
            if not row:
                return None
            return dict(row)
    finally:
        conn.close()


async def _build_meta_for_article_dict(
    article: Dict[str, Any],
) -> MetaResponse:
    """
    dict 형태의 기사 정보(id, title, body, date, link)를 받아
    - 정부 문서 후보 조회
    - TF-IDF 매칭
    - MetaResponse 생성
    """
    title = (article.get("title") or "").strip()
    body = (article.get("body") or "").strip()
    date_val = article.get("date")

    if isinstance(date_val, datetime):
        if date_val.tzinfo is None:
            base_dt = date_val.replace(tzinfo=timezone(timedelta(hours=9)))
        else:
            base_dt = date_val
    else:
        base_dt = datetime.now(timezone.utc)

    gov_docs = await fetch_all_gov_docs_around(base_dt)

    briefing = None
    if gov_docs:
        briefing = pick_best_briefing(
            article_title=title,
            article_body=body,
            article_date=base_dt,
            candidates=gov_docs,
            min_sim=0.01,
        )
        print(f"[brief] pick_best_briefing -> {bool(briefing)}")

    return MetaResponse(
        claim=None,
        opposing=None,
        bill=None,
        briefing=briefing,
    )


async def build_meta_by_id(db, article_id: int) -> MetaResponse:
    article = await asyncio.to_thread(_fetch_article_by_id_sync, article_id)
    if not article:
        raise ValueError("Article not found")
    return await _build_meta_for_article_dict(article)


async def build_meta_by_link(db, link: str) -> MetaResponse:
    article = await asyncio.to_thread(_fetch_article_by_link_sync, link)
    if not article:
        raise ValueError("Article not found")
    return await _build_meta_for_article_dict(article)
