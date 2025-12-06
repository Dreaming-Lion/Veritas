from fastapi import APIRouter, HTTPException, Body, Query
import os
import re
import logging
import psycopg2
from typing import List, Optional, Dict, Any
from datetime import datetime, date  # noqa
from html import unescape as html_unescape

log = logging.getLogger(__name__)
router = APIRouter()

# -------------------- DB 연결 및 초기화 --------------------
def get_conn():
    return psycopg2.connect(
        host=os.getenv("PGHOST", "db"),
        dbname=os.getenv("PGDATABASE", "appdb"),
        user=os.getenv("PGUSER", "appuser"),
        password=os.getenv("PGPASSWORD", "apppw"),
        port=int(os.getenv("PGPORT", "5432")),
    )


def init_db():
    """news.summary 컬럼이 없으면 추가."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS news (
            id SERIAL PRIMARY KEY,
            title   TEXT NOT NULL,
            content TEXT,
            date    TIMESTAMP,
            link    TEXT UNIQUE
        )
    """
    )
    cur.execute("ALTER TABLE news ADD COLUMN IF NOT EXISTS summary TEXT")
    conn.commit()
    cur.close()
    conn.close()


ADVISORY_LOCK_KEY = 777001


def acquire_lock(cur) -> bool:
    cur.execute("SELECT pg_try_advisory_lock(%s)", (ADVISORY_LOCK_KEY,))
    return bool(cur.fetchone()[0])


def release_lock(cur):
    cur.execute("SELECT pg_advisory_unlock(%s)", (ADVISORY_LOCK_KEY,))


# -------------------- 요약 파라미터 & 옵션 --------------------
DEFAULT_MAX_SENTENCES = int(os.getenv("SUMMARY_MAX_SENTENCES", "3"))
_env_chars = os.getenv("SUMMARY_MAX_CHARS", "").strip()
DEFAULT_MAX_CHARS: Optional[int] = int(_env_chars) if _env_chars.isdigit() else None

USE_HF = os.getenv("USE_TRANSFORMERS_SUMMARY", "0") == "1"
_hf = None
if USE_HF:
    try:
        from transformers import pipeline  # type: ignore

        _hf = pipeline(
            "summarization",
            model=os.getenv("HF_SUMMARY_MODEL", "gogamza/kobart-summarization"),
            device_map="auto",
        )
        log.info("[summary] HF pipeline ready")
    except Exception as e:
        log.warning("[summary] HF disabled: %s", e)
        _hf = None

_has_sklearn = False
try:
    import numpy as np  # type: ignore
    from sklearn.feature_extraction.text import TfidfVectorizer  # type: ignore
    from sklearn.metrics.pairwise import cosine_similarity  # type: ignore

    _has_sklearn = True
except Exception as e:
    log.warning("[summary] sklearn missing: %s (fallback to lead)", e)

_has_kss = False
try:
    import kss  # type: ignore

    _has_kss = True
except Exception:
    _has_kss = False


# -------------------- 보일러플레이트/캡션 제거 --------------------
JUNK_LINE_PATTERNS = [
    r"^\s*(서울|세종|부산|인천|대전|광주|대구|울산|수원|춘천|제주|전주|청주|포항|창원|경주|의정부|천안|남양주|안산|용인|성남|서울신문|연합뉴스|뉴스1|뉴시스|노컷뉴스|머니투데이|매일경제|한국경제)\s*(DB|자료사진|사진|그래픽)\s*$",
    r"^\s*\[[^\]]*(사진|그래픽|영상|신문)[^\]]*\]\s*$",
    r"^\s*\(.*(사진|영상|그래픽|신문).*\)\s*$",
    r"Copyright.*All rights reserved",
    r"무단\s*전재|재배포|AI\s*학습\s*이용\s*금지",
    r"이메일\s*[:：]|카카오톡\s*[:：]|페이스북\s*[:：]|트위터\s*[:：]",
    r"[A-Za-z0-9_.+-]+@[A-Za-z0-9_.+-]+",
    r"\b구독\b|\b좋아요\b|\b알림설정\b|\b광고문구\b",
    # 방송 스크립트용 junk
    r"^\s*\[(앵커|기자)\]\s*$",
    r"영상취재\s",
    r"영상편집\s",
    r"그래픽\s",
    r"기사문의\s*및\s*제보",
]


def _is_junk_sentence(s: str) -> bool:
    # 너무 짧거나, 저작권/광고/연락처/제보 안내 등은 버림
    if len(s) <= 5:
        return True
    junk_kw = [
        "무단 전재",
        "All rights reserved",
        "©",
        "이메일 :",
        "카카오톡 :",
        "카톡/라인",
        "구독",
        "좋아요",
        "알림설정",
        "광고",
        "기사문의 및 제보",
        "연합뉴스TV 기사문의 및 제보",
        "연합뉴스TV 윤솔입니다",
        "좋아요", "응원해요", "후속 원해요", "0", "-",
        "ADVERTISEMENT",
        "ⓒ SBS & SBS i / RSS 피드는 개인 리더 이용 목적으로 허용 되어 있습니다. 피드를 이용한 게시 등의 무단 복제는 금지 되어 있습니다. ▶  SBS 뉴스 앱 다운로드",
        "▶ 뉴스에 지식을 담다 - 스브스프리미엄 앱 다운로드",
        "ⓒ SBS & SBS i  : 무단복제 및 재배포 금지",
        "SBS & SBS i"
    ]
    return any(k in s for k in junk_kw)


def preclean(text: str) -> str:
    """
    요약 전 본문에서 보일러플레이트/캡션/저작권/연락처/제보 안내 등을 제거.
    개행/공백도 정돈.
    """
    text = html_unescape(text or "").strip()
    text = re.sub(r"\r\n?", "\n", text)

    lines = [ln.strip() for ln in text.split("\n")]
    kept = []
    for ln in lines:
        if not ln:
            continue
        # "연합뉴스 DB" 같은 캡션 제거
        if len(ln) <= 14 and "DB" in ln and re.fullmatch(r"[A-Z가-힣 \[\]()]+", ln or ""):
            continue
        if any(re.search(pat, ln, flags=re.IGNORECASE) for pat in JUNK_LINE_PATTERNS):
            continue
        kept.append(ln)

    text = "\n".join(kept)
    # 기자 서명 제거: "OOO 기자 이메일" 패턴
    text = re.sub(
        r"[가-힣A-Za-z·\.\-]+ 기자\s*[A-Za-z0-9_.+-]+@[A-Za-z0-9_.+-]+",
        " ",
        text,
    )
    # 공백 정리
    text = re.sub(r"[ \t\u00A0]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# -------------------- 문장 분리 --------------------
def split_sentences_ko(text: str) -> List[str]:
    text = (text or "").strip()
    if not text:
        return []
    if _has_kss:
        sents = kss.split_sentences(text)  # type: ignore
        sents = [s.strip() for s in sents if s and s.strip()]
    else:
        # 단순 휴리스틱
        sents = re.split(r'(?<=[\.!?]|…|”|")\s+|(?<=다\.|요\.)\s+', text)
        sents = [s.strip() for s in sents if s.strip()]

    # 괄호 안 캡션 제거
    sents = [
        re.sub(
            r"\s*\((?:사진|영상|자료|뉴스1|연합뉴스|무단 전재.*?|All rights reserved).*?\)\s*$",
            "",
            s,
        ).strip()
        for s in sents
    ]
    # 너무 짧거나 잡스러운 문장 제거
    sents = [s for s in sents if len(s) >= 6 and not _is_junk_sentence(s)]
    return sents


# -------------------- 1) 리드 요약 (앞에서 N문장) --------------------
def _lead_summarize(text: str, max_sentences: int, max_chars: Optional[int]) -> str:
    """
    뉴스 기사에서 가장 흔한 방법:
    - 전처리 + 문장 분리 후,
    - 앞에서 max_sentences개 문장을 그대로 이어 붙인다.
    """
    sents = split_sentences_ko(text)
    if not sents:
        return ""

    k = max_sentences if max_sentences and max_sentences > 0 else len(sents)
    picked = sents[:k]
    out = " ".join(picked).strip()

    if max_chars is not None and max_chars > 0 and len(out) > max_chars:
        clipped: List[str] = []
        total = 0
        for s in picked:
            if total + len(s) <= max_chars:
                clipped.append(s)
                total += len(s) + 1
            else:
                break
        out = " ".join(clipped).strip()
    return out


# -------------------- 2) LexRank 스타일 centrality 계산 --------------------
def _lexrank_scores(
    sim,
    threshold: float = 0.1,
    damping: float = 0.85,
    max_iter: int = 100,
    tol: float = 1e-6,
):
    """
    LexRank-style PageRank on sentence similarity graph.
    sim: (n, n) similarity matrix
    """
    import numpy as np

    n = sim.shape[0]

    # threshold 이상인 것만 edge로 사용
    adj = (sim >= threshold).astype(float)
    np.fill_diagonal(adj, 0.0)

    # 행 정규화 (전이 확률 행렬)
    row_sums = adj.sum(axis=1, keepdims=True)
    row_sums[row_sums == 0] = 1.0
    P = adj / row_sums

    # PageRank
    v = np.ones(n) / n
    for _ in range(max_iter):
        v_new = (1 - damping) / n + damping * (P.T @ v)
        if np.linalg.norm(v_new - v, 1) < tol:
            break
        v = v_new
    return v


# -------------------- 2) LexRank 스타일 extractive 요약 --------------------
def _extractive_summarize(
    text: str,
    max_sentences: int,
    max_chars: Optional[int],
) -> str:
    """
    LexRank 스타일: 문장 TF-IDF → 문장-문장 유사도 → PageRank → 상위 N문장.
    """
    sents = split_sentences_ko(text)
    if not sents:
        return ""

    k = max_sentences if max_sentences and max_sentences > 0 else 3

    # 문장이 너무 적거나, sklearn 없으면 그냥 리드 요약
    if len(sents) <= k or not _has_sklearn:
        return _lead_summarize(text, k, max_chars)

    # 너무 긴 기사 방지: 앞 80문장만
    keep = sents[:80]

    vec = TfidfVectorizer(
        analyzer="word",
        ngram_range=(1, 2),
        min_df=1,
    )  # type: ignore
    X = vec.fit_transform(keep)
    sim = cosine_similarity(X)  # type: ignore

    import numpy as np  # type: ignore

    np.fill_diagonal(sim, 0.0)

    # LexRank 점수 계산
    scores = _lexrank_scores(sim, threshold=0.1, damping=0.85)

    idx = scores.argsort()[::-1][:k]  # 점수 높은 순 top-k
    idx = sorted(idx.tolist())  # 기사 원래 순서 유지

    picked = [keep[i] for i in idx]
    out = " ".join(picked).strip()

    if max_chars is not None and max_chars > 0 and len(out) > max_chars:
        clipped: List[str] = []
        total = 0
        for s in picked:
            if total + len(s) <= max_chars:
                clipped.append(s)
                total += len(s) + 1
            else:
                break
        out = " ".join(clipped).strip()
    return out


# -------------------- 3) HF 모델 기반 abstractive 요약 --------------------
def _hf_summarize(
    text: str,
    max_sentences: int,
    max_chars: Optional[int],
) -> str:
    """
    KoBART 등 huggingface summarization 모델을 쓰는 경우.
    내부적으로는 chunking 후 모델 요약 → 문장 분리 → 상위 N문장 선택.
    """
    if not _hf:
        return ""

    # 문장 기준으로 chunking (한 chunk당 대략 1500자)
    outs: List[str] = []
    buf: List[str] = []
    total = 0
    chunks: List[str] = []

    for s in split_sentences_ko(text):
        if total + len(s) > 1500 and buf:
            chunks.append(" ".join(buf))
            buf = []
            total = 0
        buf.append(s)
        total += len(s) + 1
    if buf:
        chunks.append(" ".join(buf))

    for ch in chunks:
        out = _hf(  # type: ignore
            ch,
            max_length=int(os.getenv("HF_MAX_LENGTH", "192")),
            min_length=int(os.getenv("HF_MIN_LENGTH", "30")),
            do_sample=False,
        )[0]["summary_text"].strip()
        outs.append(out)

    merged = " ".join(outs)
    sents = split_sentences_ko(merged)

    k = max_sentences if max_sentences and max_sentences > 0 else len(sents)
    picked = sents[:k]
    out = " ".join(picked).strip()

    if max_chars is not None and max_chars > 0 and len(out) > max_chars:
        clipped: List[str] = []
        total = 0
        for s in picked:
            if total + len(s) <= max_chars:
                clipped.append(s)
                total += len(s) + 1
            else:
                break
        out = " ".join(clipped).strip()
    return out


# -------------------- 최종 요약 진입점 --------------------
def summarize(
    text: str,
    max_sentences: Optional[int] = DEFAULT_MAX_SENTENCES,
    max_chars: Optional[int] = DEFAULT_MAX_CHARS,
) -> str:
    """
    일반적인 뉴스 요약 전략:
    1) 본문 전처리(preclean)
    2) HF 모델 있으면 → abstractive 2~3문장
    3) 실패/미사용 시 → LexRank extractive 2~3문장
    4) 그것도 안 되면 → 리드 요약(앞에서 N문장)

    항상 "기사 전체 대비 눈에 띄게 짧은 2~3줄 요약"이 되도록 의도.
    """
    raw = preclean(text)
    if not raw:
        return ""

    k = max_sentences if max_sentences and max_sentences > 0 else DEFAULT_MAX_SENTENCES

    # 1. HF abstractive
    if _hf:
        try:
            out = _hf_summarize(raw, k, max_chars)
            # 요약이 원문 대비 충분히 짧으면 사용
            if len(out) <= len(raw) * 0.7:
                return out
        except Exception as e:
            log.warning("[summary] HF failed: %s; fallback to extractive", e)

    # 2. LexRank extractive
    if _has_sklearn:
        out = _extractive_summarize(raw, k, max_chars)
        if len(out) <= len(raw) * 0.7:
            return out

    # 3. 최종 폴백: 리드 요약
    return _lead_summarize(raw, k, max_chars)


# -------------------- 핵심 로직 (DB 업데이트) --------------------
def _update_summary_for_ids(
    ids: List[int],
    *,
    force: bool = False,
    max_sentences: Optional[int] = DEFAULT_MAX_SENTENCES,
    max_chars: Optional[int] = DEFAULT_MAX_CHARS,
) -> Dict[str, Any]:
    if not ids:
        return {"updated": 0, "total": 0}

    conn = get_conn()
    cur = conn.cursor()
    try:
        if not acquire_lock(cur):
            return {
                "skipped": True,
                "reason": "locked",
                "updated": 0,
                "total": 0,
            }

        cur.execute(
            """
            SELECT id, content, COALESCE(summary, '')
            FROM news
            WHERE id = ANY(%s)
        """,
            (ids,),
        )
        rows = cur.fetchall()

        updated = 0
        for _id, content, summary_old in rows:
            if not force and summary_old:
                continue
            if not content:
                continue
            s = summarize(content, max_sentences=max_sentences, max_chars=max_chars)
            cur.execute("UPDATE news SET summary=%s WHERE id=%s", (s, _id))
            updated += 1

        conn.commit()
        return {"updated": updated, "total": len(rows), "skipped": False}
    finally:
        try:
            release_lock(cur)
        except Exception:
            pass
        cur.close()
        conn.close()


def _update_summary_missing(
    limit: int = 200,
    *,
    force: bool = False,
    max_sentences: Optional[int] = DEFAULT_MAX_SENTENCES,
    max_chars: Optional[int] = DEFAULT_MAX_CHARS,
) -> Dict[str, Any]:
    conn = get_conn()
    cur = conn.cursor()
    try:
        if not acquire_lock(cur):
            return {
                "skipped": True,
                "reason": "locked",
                "updated": 0,
                "total": 0,
            }

        where_clauses = ["content IS NOT NULL", "content <> ''"]
        if not force:
            # 기본 모드: summary가 비어 있는 기사만
            where_clauses.append("(summary IS NULL OR summary = '')")

        sql = f"""
            SELECT id, content
            FROM news
            WHERE {' AND '.join(where_clauses)}
            ORDER BY id DESC
            LIMIT %s
        """
        cur.execute(sql, (limit,))
        rows = cur.fetchall()

        updated = 0
        for _id, content in rows:
            if not content:
                continue
            s = summarize(content, max_sentences=max_sentences, max_chars=max_chars)
            cur.execute("UPDATE news SET summary=%s WHERE id=%s", (s, _id))
            updated += 1

        conn.commit()
        return {"updated": updated, "total": len(rows), "skipped": False}
    finally:
        try:
            release_lock(cur)
        except Exception:
            pass
        cur.close()
        conn.close()


# -------------------- 크롤링 이후 내부 호출용 헬퍼 --------------------
def run_summary_after_crawl(
    ids: Optional[List[int]] = None,
    *,
    force: bool = False,
    limit: int = 200,
    max_sentences: Optional[int] = DEFAULT_MAX_SENTENCES,
    max_chars: Optional[int] = DEFAULT_MAX_CHARS,
) -> Dict[str, Any]:
    """
    크롤링이 끝난 뒤, 내부에서 바로 요약을 돌릴 때 사용하는 헬퍼.
    - ids가 있으면 해당 id만 요약 갱신
    - ids가 없으면 summary가 비어 있는 최신 기사들만 limit 개수만큼 처리
      (force=True면 요약 여부 상관없이 최신 기사들 강제 재요약)
    """
    init_db()
    if ids:
        return _update_summary_for_ids(
            ids,
            force=force,
            max_sentences=max_sentences,
            max_chars=max_chars,
        )
    return _update_summary_missing(
        limit=limit,
        force=force,
        max_sentences=max_sentences,
        max_chars=max_chars,
    )


# -------------------- API --------------------
@router.post("/webhook/crawl-complete")
def webhook_crawl_complete(payload: Dict[str, Any] = Body(...)):
    """
    payload 예:
      { "ids": [101,102], "force": true }
      { "limit": 300, "max_sentences": 3 }
      { "ids": [..], "max_sentences": 2, "max_chars": 500 }
    """
    init_db()
    ids: Optional[List[int]] = payload.get("ids")
    force: bool = bool(payload.get("force", False))
    limit: int = int(payload.get("limit", 200))
    max_sentences: Optional[int] = payload.get(
        "max_sentences", DEFAULT_MAX_SENTENCES
    )
    max_chars_raw = payload.get("max_chars", None)
    max_chars: Optional[int]
    if isinstance(max_chars_raw, int):
        max_chars = max_chars_raw
    elif isinstance(max_chars_raw, str) and max_chars_raw.isdigit():
        max_chars = int(max_chars_raw)
    else:
        max_chars = None

    if ids:
        res = _update_summary_for_ids(
            ids,
            force=force,
            max_sentences=max_sentences,
            max_chars=max_chars,
        )
    else:
        res = _update_summary_missing(
            limit=limit,
            force=force,
            max_sentences=max_sentences,
            max_chars=max_chars,
        )
    return {"ok": True, **res}


@router.post("/admin/summary/run")
def admin_summary_run(
    ids: Optional[List[int]] = Body(None),
    force: bool = Body(False),
    limit: int = Body(200),
    max_sentences: Optional[int] = Body(DEFAULT_MAX_SENTENCES),
    max_chars: Optional[int] = Body(None),
):
    init_db()
    if ids:
        res = _update_summary_for_ids(
            ids,
            force=force,
            max_sentences=max_sentences,
            max_chars=max_chars,
        )
    else:
        res = _update_summary_missing(
            limit=limit,
            force=force,
            max_sentences=max_sentences,
            max_chars=max_chars,
        )
    return {"ok": True, **res}


@router.get("/admin/summary/health")
def summary_health():
    init_db()
    return {
        "ok": True,
        "hf": bool(_hf),
        "sklearn": _has_sklearn,
        "kss": _has_kss,
        "defaults": {
            "max_sentences": DEFAULT_MAX_SENTENCES,
            "max_chars": DEFAULT_MAX_CHARS,
        },
    }


# ---- summary-only 조회 API ----
@router.get("/article/{article_id:int}/summary")
def get_summary_by_id(
    article_id: int,
    strict: bool = Query(False, description="True면 summary 없을 때 404 반환"),
):
    """
    특정 기사 id의 요약만 반환.
    - 기본(strict=False): summary 없으면 빈 문자열 반환
    - strict=True       : summary 없으면 404
    """
    init_db()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT summary FROM news WHERE id=%s LIMIT 1", (article_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        raise HTTPException(404, "article not found")

    summary = (row[0] or "").strip()
    if strict and not summary:
        raise HTTPException(404, "summary not available")

    return {"summary": summary}


@router.get("/article/summary/by-link")
def get_summary_by_link(
    link: str = Query(..., description="원문 링크(URL)"),
    strict: bool = Query(False, description="True면 summary 없을 때 404 반환"),
):
    """
    원문 링크로 기사 요약만 반환.
    - strict=True면 summary 없을 때 404
    """
    init_db()
    raw = link
    norm = html_unescape(raw).replace("&amp;", "&")

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT summary
        FROM news
        WHERE link = %s OR link = %s
        LIMIT 1
    """,
        (raw, norm),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        raise HTTPException(404, "article not found")

    summary = (row[0] or "").strip()
    if strict and not summary:
        raise HTTPException(404, "summary not available")

    return {"summary": summary}


@router.get("/article/summary")
def list_summaries(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    q: Optional[str] = Query(None, description="제목/본문 간단 검색(옵션)"),
):
    """
    최신 요약 목록(페이징).
    - 응답: items: [{id, summary}], count
    - q가 있으면 title/content LIKE 검색
    """
    init_db()

    where = ["summary IS NOT NULL", "summary <> ''"]
    params: List[Any] = []

    if q:
        where.append("(title ILIKE %s OR content ILIKE %s)")
        like = f"%{q}%"
        params.extend([like, like])

    sql = f"""
        SELECT id, summary
        FROM news
        WHERE {' AND '.join(where)}
        ORDER BY date DESC NULLS LAST, id DESC
        LIMIT %s OFFSET %s
    """
    params.extend([limit, offset])

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(sql, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    items = [{"id": r[0], "summary": (r[1] or "").strip()} for r in rows]
    return {"count": len(items), "items": items}
