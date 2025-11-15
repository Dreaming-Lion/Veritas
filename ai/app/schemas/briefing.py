from datetime import datetime
from typing import Optional, Literal, List
from pydantic import BaseModel

class KeyClaim(BaseModel):
    text: str


class OpposingNews(BaseModel):
    title: str
    excerpt: str
    press: str
    url: Optional[str] = None


class BillInfo(BaseModel):
    name: str
    number: str
    status: str
    brief: str
    url: Optional[str] = None


class BriefingInfo(BaseModel):
    dept: str  
    date: str 
    title: str
    summary: str
    url: Optional[str] = None


class MetaResponse(BaseModel):
    claim: Optional[KeyClaim] = None
    opposing: Optional[OpposingNews] = None
    bill: Optional[BillInfo] = None
    briefing: Optional[BriefingInfo] = None


SourceType = Literal["policy_news", "press_release", "speech"]


class GovDoc(BaseModel):
    source_type: SourceType
    news_item_id: str
    title: str
    body: str
    approve_datetime: datetime
    minister: str
    original_url: Optional[str] = None


class BillDoc(BaseModel):
    bill_id: str
    bill_no: str
    name: str
    committee: Optional[str] = None
    propose_datetime: datetime
    status: Optional[str] = None
    detail_link: Optional[str] = None
    proposer: Optional[str] = None