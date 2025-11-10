// src/pages/ArticleDetailPage.tsx
import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

/* ------------------------ 타입 ------------------------ */
type ApiArticle = {
  id: number;
  title: string | null;
  content: string | null;
  date: string | null;
  link: string | null;
};

type KeyClaim = { text: string };
type OpposingNews = { title: string; excerpt: string; press: string; url?: string };
type BillInfo = { name: string; number: string; status: string; brief: string; url?: string };
type BriefingInfo = { dept: string; date: string; title: string; summary: string; url?: string };

type MetaResponse = {
  claim?: KeyClaim | null;
  opposing?: OpposingNews | null;
  bill?: BillInfo | null;
  briefing?: BriefingInfo | null;
};

type SummaryResponse = { summary: string };

type RecItem = {
  title: string;
  link: string;
  source?: string | null;
  date?: string | null;
  score?: number;
};
type RecResponse = {
  clicked: string;
  recommendations: RecItem[];
};
/* ------------------------------------------------------ */

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

/* 추천 파라미터를 한곳에서 관리 */
const RECO = {
  HOURS_WINDOW: 48,
  TOPK: 8,
  NLI_THRESHOLD: 0.1,
  POLL_MS: 10000,
};

// ✅ 백엔드에 *_cached 라우트가 없으면 false로 두세요.
const USE_CACHED_ENDPOINTS = false;

/* ------------------------ 텍스트 정리 유틸 ------------------------ */
const decodeHTMLEntities = (s?: string | null): string => {
  if (!s) return "";
  let out = s;
  for (let i = 0; i < 3; i++) {
    const ta = document.createElement("textarea");
    ta.innerHTML = out;
    const next = ta.value;
    if (next === out) break;
    out = next;
  }
  return out;
};

const formatArticleText = (raw?: string | null): string => {
  let t = decodeHTMLEntities(raw);
  t = t.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  t = t.replace(/\\n/g, "\n").replace(/\\t/g, "  ").replace(/\u00a0/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
};

const cleanTitle = (t?: string | null) =>
  decodeHTMLEntities(t).replace(/[“”"]/g, "").replace(/\s+/g, " ").trim();

const firstSentences = (text: string, max = 2) => {
  const s = formatArticleText(text);
  if (!s) return "";
  const bits = s
    .split(/(?<=[\.!?]|…|”|\"|다\.|요\.)\s+/g)
    .map((x) => x.trim())
    .filter(Boolean);
  return bits.slice(0, Math.max(1, max)).join(" ");
};
/* ----------------------------------------------------------------- */

const Card: React.FC<React.PropsWithChildren<{ className?: string; interactive?: boolean }>> = ({
  className = "",
  interactive = false,
  children,
}) => (
  <div
    className={[
      "bg-white border border-gray-200 rounded-xl shadow-sm",
      interactive ? "transition transform hover:shadow-md hover:-translate-y-0.5" : "",
      "focus:outline-none focus:ring-0",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; right?: React.ReactNode }> = ({
  icon,
  title,
  right,
}) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
    <div className="flex items-center gap-2 text-gray-700">
      {icon}
      <h3 className="font-semibold">{title}</h3>
    </div>
    {right}
  </div>
);

/* 아이콘 모음(필요한 곳에서만 사용) */
const Icon = {
  back: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  external: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <path d="M14 3h7v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14L21 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-700" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <path
        d="M12 9v4m0 4h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.42 3.86a2 2 0 0 0-3.12 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  bill: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <path d="M6 2h9l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 2v4h4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  mic: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 10a7 7 0 0 0 14 0M12 19v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <path d="M3 12a9 9 0 1 0 2.64-6.36L3 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 3v3h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

function hostToPress(url?: string | null) {
  try {
    if (!url) return "";
    const u = new URL(url);
    const h = u.hostname.replace(/^www\./, "");
    if (h.includes("naver.com")) return "네이버 뉴스";
    if (h.includes("daum.net")) return "다음 뉴스";
    return h;
  } catch {
    return "";
  }
}
function isoToLocal(dt?: string | null) {
  try {
    return dt ? new Date(dt).toLocaleString() : "";
  } catch {
    return dt || "";
  }
}

type OppCard = { title: string; url: string; press: string; score: number; date?: string; summary?: string };

const ArticleDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();
  const location = useLocation() as any;

  const preview = location.state?.item as
    | { id: number; title: string; excerpt?: string; time?: string; link?: string; press?: string }
    | undefined;

  const normalizeLink = (u?: string) => (u ? u.replace(/&amp;/g, "&") : undefined);
  const previewLink = normalizeLink(preview?.link);

  const [data, setData] = React.useState<ApiArticle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const [claim, setClaim] = React.useState<KeyClaim | null>(null);
  const [opposing, setOpposing] = React.useState<OpposingNews | null>(null);
  const [bill, setBill] = React.useState<BillInfo | null>(null);
  const [briefing, setBriefing] = React.useState<BriefingInfo | null>(null);

  // summary 전용 상태
  const [summary, setSummary] = React.useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState<boolean>(false);
  const [summaryErr, setSummaryErr] = React.useState<string | null>(null);

  // 🔹 추천 뉴스 상태
  const [oppList, setOppList] = React.useState<OppCard[]>([]);
  const [oppLoading, setOppLoading] = React.useState<boolean>(false);
  const [oppPending, setOppPending] = React.useState<boolean>(false); // 캐시 준비중 표시
  const pollRef = React.useRef<number | null>(null);

  /* ---------------------- 기사 본문/메타/요약 ---------------------- */
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const byId = await fetch(`${API_BASE}/article/${paramId}`);
        if (byId.ok) {
          const json: ApiArticle = await byId.json();
          if (mounted) setData(json);
        } else if (byId.status === 404 && previewLink) {
          const byLink = await fetch(`${API_BASE}/article/by-link?link=${encodeURIComponent(previewLink)}`);
          if (!byLink.ok) throw new Error(`HTTP ${byLink.status}`);
          const json: ApiArticle = await byLink.json();
          if (mounted) setData(json);
        } else {
          throw new Error(`HTTP ${byId.status}`);
        }
      } catch (e: any) {
        if (mounted) setErr(e?.message ?? "load failed");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [paramId, previewLink]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let res = await fetch(`${API_BASE}/article/${paramId}/meta`);
        if (!res.ok && previewLink) {
          res = await fetch(`${API_BASE}/article/meta/by-link?link=${encodeURIComponent(previewLink)}`);
        }
        if (!res.ok) return;
        const json: MetaResponse = await res.json();
        if (!mounted) return;
        if (json.claim) setClaim(json.claim);
        if (json.opposing) setOpposing(json.opposing);
        if (json.bill) setBill(json.bill);
        if (json.briefing) setBriefing(json.briefing);
      } catch {
        /* noop */
      }
    })();
    return () => {
      mounted = false;
    };
  }, [paramId, previewLink]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setSummaryLoading(true);
        setSummaryErr(null);

        let res = await fetch(`${API_BASE}/article/${paramId}/summary?strict=false`);
        if (!res.ok && previewLink) {
          res = await fetch(`${API_BASE}/article/summary/by-link?link=${encodeURIComponent(previewLink)}&strict=false`);
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: SummaryResponse = await res.json();
        const s = formatArticleText(json?.summary ?? "").trim();
        if (!mounted) return;

        if (s) {
          setSummary(s);
        } else {
          const fallback = firstSentences(data?.content ?? "", 2) || firstSentences(preview?.excerpt ?? "", 2);
          setSummary(fallback || null);
        }
      } catch (e: any) {
        if (!mounted) return;
        setSummaryErr(e?.message ?? "summary load failed");
        const fallback = firstSentences(data?.content ?? "", 2) || firstSentences(preview?.excerpt ?? "", 2);
        setSummary(fallback || null);
      } finally {
        if (mounted) setSummaryLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [paramId, previewLink, data?.content, preview?.excerpt]);

  /* ---------------------- 반대 의견 추천 ---------------------- */
  const originalUrl = (data?.link ?? preview?.link ?? "").replace(/&amp;/g, "&");

  const clickedUrlMaybe = React.useMemo(() => {
    const u = originalUrl || previewLink;
    return u && u.length > 0 ? u : null;
  }, [originalUrl, previewLink]);

  React.useEffect(() => {
    const maybe = clickedUrlMaybe;
    if (!maybe) return;

    // ✅ 캐시 엔드포인트를 쓰지 않는 모드: 그냥 "준비중"만 띄움
    if (!USE_CACHED_ENDPOINTS) {
      setOppList([]);
      setOppLoading(false);
      setOppPending(true);
      return;
    }

    let cancelled = false;

    const buildQS = (urlStr: string, allowStale: boolean) =>
      `clicked_link=${encodeURIComponent(urlStr)}&hours_window=${RECO.HOURS_WINDOW}&topk_return=${RECO.TOPK}&nli_threshold=${RECO.NLI_THRESHOLD}${
        allowStale ? "&allow_stale=true" : ""
      }`;

    async function fetchCachedOnly(urlStr: string): Promise<RecResponse | null> {
      const qs = buildQS(urlStr, false);
      const endpoints = [
        `${API_BASE}/article/recommend-cached?${qs}`,
        `${API_BASE}/recommend-cached?${qs}`,
        `${API_BASE}/rec/recommend-cached?${qs}`,
      ];
      for (const url of endpoints) {
        try {
          const r = await fetch(url);
          if (r.status === 204) return null; // 캐시 없음 (깨끗하게 처리)
          if (r.ok) return (await r.json()) as RecResponse;
          // 404/501 등은 캐시 없음으로 취급
        } catch {
          /* ignore */
        }
      }
      return null;
    }

    async function enrichTop(items: RecItem[], signal?: AbortSignal): Promise<OppCard[]> {
      const top3 = (items || [])
        .slice()
        .filter((x: any) => (x?.score ?? 0) >= 0.1)
        .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 3);

      const enriched = await Promise.all(
        top3.map(async (it) => {
          const url = (it.link || "").replace(/&amp;/g, "&");
          let sum = "";
          try {
            const sres = await fetch(
              `${API_BASE}/article/summary/by-link?link=${encodeURIComponent(url)}&strict=false`,
              { signal }
            );
            if (sres.ok) {
              const sj: SummaryResponse = await sres.json();
              sum = firstSentences(sj?.summary ?? "", 2);
            }
          } catch {
            /* ignore */
          }
          const press = it.source || hostToPress(url) || "언론사";
          const s = Number(it.score ?? 0);
          return {
            title: cleanTitle(it.title),
            url,
            press,
            date: it.date || undefined,
            score: Number.isFinite(s) ? s : 0,
            summary: sum,
          } as OppCard;
        })
      );
      return enriched;
    }

    async function run(urlStr: string) {
      setOppLoading(true);
      setOppPending(false);
      setOppList([]);

      const cached = await fetchCachedOnly(urlStr);
      if (cancelled) return;

      if (cached?.recommendations?.length) {
        const controller = new AbortController();
        const enriched = await enrichTop(cached.recommendations, controller.signal);
        if (!cancelled) setOppList(enriched);
        if (!cancelled) setOppLoading(false);
        return;
      }

      if (!cancelled) {
        setOppLoading(false);
        setOppPending(true); // “준비중” 표시 (사용자 수동 트리거 유도)
      }

      // 필요하다면 여기서 폴링을 계속할 수도 있음. (생략)
    }

    run(maybe);

    return () => {
      if (pollRef.current) {
        clearTimeout(pollRef.current as unknown as number);
        pollRef.current = null;
      }
    };
  }, [clickedUrlMaybe]);

  // 수동 즉시 로드(라이브 계산)
  const manualFetchLive = async () => {
    const c = clickedUrlMaybe;
    if (!c) return;

    setOppLoading(true);
    setOppPending(false);
    setOppList([]);

    const qs = `clicked_link=${encodeURIComponent(c)}&hours_window=${RECO.HOURS_WINDOW}&topk_return=${RECO.TOPK}&nli_threshold=${RECO.NLI_THRESHOLD}&allow_stale=true`;
    const endpoints = [
      `${API_BASE}/article/recommend?${qs}`,
      `${API_BASE}/recommend?${qs}`,
      `${API_BASE}/rec/recommend?${qs}`,
    ];

    let r: RecResponse | null = null;
    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          r = (await res.json()) as RecResponse;
          break;
        }
      } catch {
        /* ignore */
      }
    }

    if (!r || !Array.isArray(r.recommendations)) {
      setOppLoading(false);
      setOppList([]);
      setOppPending(true);
      return;
    }

    const controller = new AbortController();
    const top3 = (r.recommendations || [])
      .slice()
      .filter((x: any) => (x?.score ?? 0) >= 0.1)
      .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 3);

    const enriched = await Promise.all(
      top3.map(async (it) => {
        const url = (it.link || "").replace(/&amp;/g, "&");
        let sum = "";
        try {
          const sres = await fetch(
            `${API_BASE}/article/summary/by-link?link=${encodeURIComponent(url)}&strict=false`,
            { signal: controller.signal }
          );
          if (sres.ok) {
            const sj: SummaryResponse = await sres.json();
            sum = firstSentences(sj?.summary ?? "", 2);
          }
        } catch {
          /* ignore */
        }
        const press = it.source || hostToPress(url) || "언론사";
        const s = Number(it.score ?? 0);
        return {
          title: cleanTitle(it.title),
          url,
          press,
          date: it.date || undefined,
          score: Number.isFinite(s) ? s : 0,
          summary: sum,
        } as OppCard;
      })
    );

    setOppList(enriched);
    setOppLoading(false);
  };

  /* ---------------------- 렌더 ---------------------- */
  const displayTitle = cleanTitle(data?.title ?? preview?.title ?? "제목 없음");
  const displayDate = data?.date ? isoToLocal(data.date) : preview?.time || "";
  const previewExcerpt = formatArticleText(preview?.excerpt ?? "");
  const content = formatArticleText(data?.content ?? "") || previewExcerpt;

  return (
    <div className="w-screen px-4 sm:px-6 lg:px-8 xl:px-14 2xl:px-30" style={{ width: "calc(100vw - 32px)" }}>
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 max-w-[1600px] 2xl:max-w-[1920px] py-6">
        {/* 상단 헤더 */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-2 py-1 rounded transition hover:bg-gray-100 focus:outline-none"
            >
              {Icon.back}
              <span>뉴스 목록으로 돌아가기</span>
            </button>
            <span>{displayDate}</span>
          </div>

          <div className="mt-3 pl-3 sm:pl-4 md:pl-5 lg:pl-6 xl:pl-8">
            <br />
            <h1 className="mt-1 !text-[22px] sm:!text-[20px] md:!text-[26px] lg:!text-[28px] xl:!text-[30px] 2xl:!text-[40px] font-extrabold text-gray-900 leading-tight">
              {displayTitle}
            </h1>
            <br />
          </div>
        </div>

        <hr className="my-6 border-gray-200" />

        {/* 본문 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* 좌측 보조 카드들 */}
          <div className="space-y-6 lg:col-span-5 order-2 lg:order-1">
            {/* 핵심 주장 */}
            <Card interactive>
              <SectionHeader
                icon={
                  <span className="text-blue-600">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                      <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H11v16H5.5A2.5 2.5 0 0 1 3 17.5v-11Z" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M21 6.5A2.5 2.5 0 0 0 18.5 4H13v16h5.5A2.5 2.5 0 0 0 21 17.5v-11Z" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  </span>
                }
                title="핵심 주장"
              />
              <div className="p-4">
                {summaryLoading ? (
                  <div className="animate-pulse rounded-lg bg-blue-50/70 border border-blue-100 h-[64px]" />
                ) : summary ? (
                  <div className="rounded-lg bg-blue-50/70 border border-blue-100">
                    <div className="border-l-4 border-blue-300 px-4 py-3 text-blue-900/90 whitespace-pre-wrap">
                      {summary}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-gray-600">
                    요약이 아직 준비되지 않았습니다.
                  </div>
                )}
                {summaryErr && <p className="mt-2 text-xs text-red-500">요약 로드 오류: {summaryErr}</p>}
              </div>
            </Card>

            {/* 반대 의견 뉴스 (추천 3건) */}
            <Card interactive>
              <SectionHeader
                icon={<span className="text-orange-600">{Icon.alert}</span>}
                title="반대 의견 뉴스"
                right={
                  <div className="flex items-center gap-2">
                    <button
                      onClick={manualFetchLive}
                      className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs !text-gray-700 hover:bg-gray-50 transition"
                      title="지금 불러오기(캐시 미사용)"
                    >
                      {Icon.refresh}
                      지금 불러오기
                    </button>
                  </div>
                }
              />
              <div className="p-4">
                {oppLoading ? (
                  <div className="space-y-2">
                    <div className="h-16 bg-orange-50/60 border border-orange-100 rounded animate-pulse" />
                    <div className="h-16 bg-orange-50/60 border border-orange-100 rounded animate-pulse" />
                    <div className="h-16 bg-orange-50/60 border border-orange-100 rounded animate-pulse" />
                  </div>
                ) : oppList.length > 0 ? (
                  <div className="space-y-3">
                    {oppList.map((it, idx) => (
                      <a
                        key={idx}
                        href={it.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg bg-orange-50/70 border border-orange-100 hover:bg-orange-50 transition"
                      >
                        <div className="px-4 py-3">
                          <div className="flex items-center justify-between text-xs text-orange-700/70">
                            <span>출처: {it.press}</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-orange-200">
                              점수 {it.score.toFixed(2)}
                            </span>
                          </div>
                          <p className="mt-1 font-semibold text-orange-900">{it.title}</p>
                          {it.summary && <p className="mt-1 text-sm text-orange-800/90">{it.summary}</p>}
                        </div>
                      </a>
                    ))}
                  </div>
                ) : oppPending ? (
                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-gray-600">
                    추천을 준비 중입니다. “지금 불러오기”를 눌러 계산할 수 있어요.
                  </div>
                ) : (
                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-gray-600">추천 결과가 없습니다.</div>
                )}
              </div>
            </Card>

            {/* 관련 법안 */}
            <Card interactive>
              <SectionHeader icon={<span className="!text-purple-600">{Icon.bill}</span>} title="관련 법안 정보" />
              <div className="p-4">
                {bill ? (
                  <div className="rounded-lg bg-purple-50/60 border border-purple-100">
                    <div className="border-l-4 border-purple-400 px-4 py-3 space-y-3 text-purple-950/90">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-purple-700/80">법안명</div>
                          <div className="font-medium">{bill.name}</div>
                        </div>
                        <div>
                          <div className="text-purple-700/80">법안번호</div>
                          <div className="font-medium">{bill.number}</div>
                        </div>
                        <div>
                          <div className="text-purple-700/80">현재 상태</div>
                          <div className="font-medium">{bill.status}</div>
                        </div>
                      </div>
                      <div className="text-sm">{bill.brief}</div>
                      {bill.url && (
                        <a
                          href={bill.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-full text-center rounded-full bg-white border border-purple-200 py-2 text-sm !text-purple-700 hover:bg-purple-50 transition focus:outline-none"
                        >
                          관련 법안 자세히 보기
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-gray-600">연동 준비 중입니다.</div>
                )}
              </div>
            </Card>

            {/* 관련 브리핑 */}
            <Card interactive>
              <SectionHeader icon={<span className="text-green-600">{Icon.mic}</span>} title="관련 브리핑 정보" />
              <div className="p-4">
                {briefing ? (
                  <div className="rounded-lg bg-green-50/60 border border-green-100">
                    <div className="border-l-4 border-green-400 px-4 py-3 space-y-2 text-green-950/90">
                      <div className="text-sm">
                        <span className="text-green-700/80">부처</span>
                        <span className="ml-2 font-medium">{briefing.dept}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-green-700/80">일자</span>
                        <span className="ml-2 font-medium">{briefing.date}</span>
                      </div>
                      <div className="font-semibold">{briefing.title}</div>
                      <p className="text-sm">{briefing.summary}</p>
                      {briefing.url && (
                        <a
                          href={briefing.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1 rounded-full bg-white border border-green-200 px-4 py-2 text-sm !text-green-700 hover:bg-green-50 transition focus:outline-none"
                        >
                          브리핑 전문 보기
                          <svg viewBox="0 0 24 24" className="w-4 h-4">
                            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-gray-50 border border-green-100 px-4 py-3 text-gray-600">연동 준비 중입니다.</div>
                )}
              </div>
            </Card>
          </div>

          {/* 우측(본문) */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <Card className="min-h-[320px]">
              <SectionHeader
                icon={Icon.doc}
                title="뉴스 내용"
                right={
                  (data?.link ?? preview?.link) ? (
                    <a
                      href={(data?.link ?? preview?.link ?? "").replace(/&amp;/g, "&")}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm !text-gray-700 hover:bg-gray-50 transition focus:outline-none"
                    >
                      {Icon.external}
                      뉴스 원문보기
                    </a>
                  ) : null
                }
              />
              <div className="p-5">
                {loading && !content ? (
                  <div className="text-gray-500">불러오는 중…</div>
                ) : err ? (
                  <div className="text-red-600">로드 실패: {err}</div>
                ) : (
                  <>
                    <p className="text-gray-700 leading-7 whitespace-pre-wrap">{content || "본문 없음"}</p>
                    <hr className="my-4 border-gray-100" />
                    {(data?.link ?? preview?.link) ? (
                      <p className="text-sm text-gray-500">
                        전체 기사는{" "}
                        <a
                          href={(data?.link ?? preview?.link ?? "").replace(/&amp;/g, "&")}
                          target="_blank"
                          rel="noreferrer"
                          className="!text-green-700 underline font-medium"
                        >
                          원문
                        </a>
                        에서 확인하실 수 있습니다.
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">원문 링크가 없습니다.</p>
                    )}
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetailPage;
