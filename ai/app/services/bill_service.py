# app/services/bill_service.py
import os
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

import httpx

from app.schemas.briefing import BillDoc

ASSEMBLY_BILL_KEY = os.getenv("NA_BILL_KEY", "")

ASSEMBLY_BILL_URL = "https://open.assembly.go.kr/portal/openapi/nzmimeepazxkubdpn"

KST = timezone(timedelta(hours=9))


def _get_assembly_age(article_dt: datetime) -> str:
    if article_dt >= datetime(2025, 6, 4, tzinfo=KST):
        return "21"
    if article_dt >= datetime(2030, 6, 4, tzinfo=KST):
        return "22"
    return "21"


def _parse_propose_dt(s: str) -> datetime:
    if not s:
        return datetime.now(KST)
    for fmt in ("%Y-%m-%d", "%Y%m%d"):
        try:
            return datetime.strptime(s, fmt).replace(tzinfo=KST)
        except ValueError:
            continue
    return datetime.now(KST)


async def _fetch_bills_page(
    age: str,
    page_index: int,
    page_size: int = 200,
) -> List[Dict[str, Any]]:
    if not ASSEMBLY_BILL_KEY:
        return []

    params = {
        "KEY": ASSEMBLY_BILL_KEY,
        "Type": "json",
        "pIndex": page_index,
        "pSize": page_size,
        "AGE": age,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(ASSEMBLY_BILL_URL, params=params)
        r.raise_for_status()
    data = r.json()

    root = data.get("nzmimeepazxkubdpn", [])
    rows: List[Dict[str, Any]] = []
    for block in root:
        if isinstance(block, dict) and "row" in block:
            part = block["row"]
            if isinstance(part, list):
                rows.extend(part)
            elif isinstance(part, dict):
                rows.append(part)
    return rows


async def fetch_bills_around(
    article_dt: datetime,
    days_before: int = 30,
    days_after: int = 7,
    max_pages: int = 5,
    page_size: int = 200,
) -> List[BillDoc]:
    age = _get_assembly_age(article_dt)
    start = (article_dt - timedelta(days=days_before)).date()
    end = (article_dt + timedelta(days=days_after)).date()

    all_rows: List[Dict[str, Any]] = []

    for p in range(1, max_pages + 1):
        rows = await _fetch_bills_page(age=age, page_index=p, page_size=page_size)
        if not rows:
            break
        all_rows.extend(rows)
        if len(rows) < page_size:
            break

    docs: List[BillDoc] = []
    for row in all_rows:
        propose_dt_str = row.get("PROPOSE_DT", "")
        propose_dt = _parse_propose_dt(propose_dt_str)
        if not (start <= propose_dt.date() <= end):
            continue

        bill = BillDoc(
            bill_id=str(row.get("BILL_ID", "")),
            bill_no=str(row.get("BILL_NO", "")),
            name=row.get("BILL_NAME", "") or "",
            committee=row.get("COMMITTEE", "") or None,
            propose_datetime=propose_dt,
            status=row.get("PROC_RESULT", "") or None,
            detail_link=row.get("DETAIL_LINK", None),
            proposer=row.get("PROPOSER", "") or None,
        )
        docs.append(bill)

    return docs
