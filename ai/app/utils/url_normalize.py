import html, re
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urlunparse, urljoin, parse_qsl, urlencode

_TRACKING_KEYS = {
    "gclid","fbclid","ncid","ref","ref_src","referrer","spm",
    "utm_source","utm_medium","utm_campaign","utm_term","utm_content"
}
_AMP_PATH_RE = re.compile(r'/amp(?:/|$)', re.I)

def strip_tracking_params(u: str) -> str:
    try:
        u = html.unescape(u)
        pu = urlparse(u)
        q = [(k, v) for k, v in parse_qsl(pu.query, keep_blank_values=True)
             if not (k in _TRACKING_KEYS or k.startswith("utm_"))]
        return urlunparse(pu._replace(query=urlencode(q)))
    except Exception:
        return u

def normalize_variant_urls(u: str) -> str:
    pu = urlparse(u)
    host = pu.netloc
    if host.startswith("m.") and "naver.com" not in host:
        host = host[2:]
    path = _AMP_PATH_RE.sub("/", pu.path)
    return urlunparse(pu._replace(netloc=host, path=path))

def _resolve_naver_origin(u: str) -> str | None:
    """네이버 기사에서 '기사 원문' 링크를 추출해 절대경로로 반환."""
    try:
        with httpx.Client(follow_redirects=True, timeout=10.0,
                          headers={"User-Agent": "VeritasBot/0.1"}) as c:
            r = c.get(u)
            r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        a = soup.select_one(
            "a.media_end_head_origin_link, a.media_end_link, a[aria-label='기사 원문']"
        )
        if a and a.get("href"):
            href = urljoin(u, a["href"])
            return normalize_variant_urls(strip_tracking_params(href))
    except Exception:
        pass
    return None

def normalize_clicked(u: str) -> str:
    """클릭 URL을 정리(+네이버면 원문으로 치환)."""
    u = normalize_variant_urls(strip_tracking_params(u))
    host = urlparse(u).netloc
    if host.endswith("news.naver.com") or host.endswith("n.news.naver.com"):
        orig = _resolve_naver_origin(u)
        if orig:
            return orig
    return u
