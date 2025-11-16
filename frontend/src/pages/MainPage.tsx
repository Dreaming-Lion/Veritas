import React from "react";
import { Link } from "react-router-dom";
import useBookmarks, { type Article } from "../hook/useBookmarks";
import { useAuthDialog } from "../components/auth/AuthDialogProvider";

// ------------ types ------------
type ApiArticle = {
  id: number;
  title: string;
  content?: string | null;
  summary?: string | null;
  date?: string | null;
  link: string;
};
type BackendListResponse = { count: number; articles: ApiArticle[] };
type ArticleEx = Article & { link: string; content?: string | null };

const PAGE_SIZE = 18;

const apiUrl = (path: string) => {
  const base = import.meta.env.VITE_API_BASE as string | undefined;
  return base ? `${base}${path}` : `/api${path}`;
};

// ------------ helpers ------------
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

const cleanTitle = (t?: string | null): string => {
  let s = decodeHTMLEntities(t);
  s = s.replace(/[“”"]/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
};

const toExcerpt = (raw?: string | null): string => {
  const base = decodeHTMLEntities(raw).replace(/\s+/g, " ").trim();
  if (!base) return "본문 미리보기가 없습니다.";
  return base.length > 50 ? base.slice(0, 50) + "…" : base;
};

const formatRelativeKorean = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";

  const now = Date.now();
  let diffMs = now - d.getTime();
  if (diffMs < 0) diffMs = 0;

  const m = 60 * 1000;
  const h = 60 * m;
  const day = 24 * h;
  const week = 7 * day;

  if (diffMs < 30 * 1000) return "방금 전";
  if (diffMs < m) return `${Math.floor(diffMs / 1000)}초 전`;
  if (diffMs < h) return `${Math.floor(diffMs / m)}분 전`;
  if (diffMs < day) return `${Math.floor(diffMs / h)}시간 전`;
  if (diffMs < week) return `${Math.floor(diffMs / day)}일 전`;
  if (diffMs < 30 * day) return `${Math.floor(diffMs / week)}주 전`;

  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
  return `${yy}.${mm}.${dd} ${hhmm}`;
};

const useNowTick = (intervalMs = 60_000) => {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
};

/**
 * 네이버 뉴스 링크만 필터링하는 헬퍼
 * - 절대/상대 URL 모두 처리
 * - news.naver.com, n.news.naver.com 및 하위 서브도메인 허용
 */
const isNaverNewsLink = (rawLink?: string | null): boolean => {
  if (!rawLink) return false;
  const fixed = rawLink.trim().replace(/&amp;/g, "&");

  try {
    // base를 줘서 /mnews/... 같은 상대경로도 처리 가능
    const u = new URL(fixed, "https://news.naver.com");
    const host = u.hostname.toLowerCase();

    if (host === "news.naver.com" || host === "n.news.naver.com") return true;
    if (host.endsWith(".news.naver.com")) return true;

    return false;
  } catch {
    // URL 파싱 실패 시 문자열 기준으로 대충 한 번 더 체크
    const s = fixed.toLowerCase();
    return (
      s.includes("news.naver.com") ||
      s.startsWith("/mnews/") ||
      s.startsWith("/article/")
    );
  }
};

// ------------ UI ------------
const BookmarkButton: React.FC<{ saved: boolean; onToggle: () => void }> = ({
  saved,
  onToggle,
}) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onFocus={(e) => (e.currentTarget as HTMLButtonElement).blur()}
    onClick={() => {
      onToggle();
    }}
    className="p-1.5 rounded appearance-none !outline-none ring-0 !border-0 !bg-transparent"
    aria-label={saved ? "북마크 해제" : "북마크"}
    title={saved ? "북마크 해제" : "북마크"}
  >
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <path
        d="M7 3h10a1 1 0 0 1 1 1v16l-6-3-6 3V4a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={saved ? "hidden" : "block text-gray-500"}
      />
      <path
        d="M7 3h10a1 1 0 0 1 1 1v16l-6-3-6 3V4a1 1 0 0 1 1-1z"
        className={saved ? "block fill-green-500 text-green-500" : "hidden"}
      />
    </svg>
  </button>
);

const Card: React.FC<{
  item: ArticleEx;
  saved: boolean;
  onToggle: () => void;
}> = ({ item, saved, onToggle }) => {
  useNowTick();
  const relative = formatRelativeKorean(item.time);

  return (
    <Link
      to={`/Detail/${item.id}`}
      state={{ item }}
      className="group w-full text-left !bg-white rounded-xl shadow-sm transition hover:shadow-lg
                 hover:-translate-y-0.5 p-4 h-full flex flex-col !border-l-4 !border-green-500"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{relative}</span>
        <span
          onClick={(e) => {
            e.preventDefault(); // 링크 이동 방지
            onToggle();
          }}
        >
          <BookmarkButton saved={saved} onToggle={onToggle} />
        </span>
      </div>

      <h2 className="mb-2 font-semibold text-gray-800 leading-snug line-clamp-2 min-h-[2.75rem]">
        {item.title}
      </h2>

      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 min-h-[3.25rem] mb-4">
        {item.excerpt}
      </p>

      <div className="mt-auto flex items-center justify-between text-sm pt-2">
        <span className="!text-gray-500">네이버 뉴스</span>
        <span className="!text-green-600 font-semibold group-hover:translate-x-0.5 transition">
          자세히 보기 →
        </span>
      </div>
    </Link>
  );
};

type FetchPageResult = {
  mapped: ArticleEx[];
  rawCount: number; // 서버가 준 원본 기사 개수 (필터 전)
};

const MainPage: React.FC = () => {
  const [allItems, setAllItems] = React.useState<ArticleEx[]>([]);
  const [items, setItems] = React.useState<ArticleEx[]>([]);
  const [visibleCount, setVisibleCount] = React.useState<number>(PAGE_SIZE);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [nextOffset, setNextOffset] = React.useState(0); // DB offset (필터 전 개수 기준)
  const [serverHasMore, setServerHasMore] = React.useState(true);

  const { isSaved, toggle } = useBookmarks();
  const { open: openAuth } = useAuthDialog();

  const mapArticles = (list: ApiArticle[]): ArticleEx[] => {
    // 1차: 네이버 뉴스만 필터
    const filtered = list.filter((a) => isNaverNewsLink(a.link));

    // 디버깅용 로그 (필요 없으면 지워도 됨)
    if (list.length > 0) {
      console.log("[/article] first raw link =", list[0].link);
      console.log(
        "[/article] filtered count / raw count =",
        filtered.length,
        "/",
        list.length
      );
    }

    const baseList = filtered.length > 0 ? filtered : list;

    return baseList.map((a) => ({
      id: a.id,
      title: cleanTitle(a.title),
      excerpt: toExcerpt(a.summary ?? a.content),
      time: a.date ?? "",
      press: "네이버 뉴스",
      link: (a.link || "").replace(/&amp;/g, "&"),
      content: a.content ? decodeHTMLEntities(a.content) : null,
    }));
  };

  const fetchPage = React.useCallback(
    async (offset: number): Promise<FetchPageResult> => {
      const res = await fetch(
        apiUrl(`/article?limit=${PAGE_SIZE}&offset=${offset}`),
        {
          headers: { Accept: "application/json" },
        }
      );
      if (!res.ok) throw new Error(`GET /article 실패 (status ${res.status})`);
      const j: BackendListResponse = await res.json();

      const rawCount = j.articles?.length ?? 0; // 서버에서 실제로 가져온 개수
      const mapped = mapArticles(j.articles ?? []);

      // "서버에 다음 페이지가 있는지"는 필터 전 개수 기준으로 판단
      setServerHasMore(rawCount === PAGE_SIZE);

      return { mapped, rawCount };
    },
    []
  );

  React.useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const { mapped: first, rawCount } = await fetchPage(0);
        setAllItems(first);
        setNextOffset(rawCount); // DB에서 가져온 원본 개수만큼 offset 증가
        setVisibleCount(Math.min(PAGE_SIZE, first.length));
        setItems(first);
      } catch (e) {
        console.error(e);
        setAllItems([]);
        setItems([]);
        setVisibleCount(0);
        setServerHasMore(false);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [fetchPage]);

  React.useEffect(() => {
    if (!query.trim()) {
      setItems(allItems);
      setVisibleCount(Math.min(PAGE_SIZE, allItems.length));
      return;
    }
    const q = query.trim().toLowerCase();
    const filtered = allItems.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.excerpt.toLowerCase().includes(q)
    );
    setItems(filtered);
    setVisibleCount(Math.min(PAGE_SIZE, filtered.length));
  }, [query, allItems]);

  const handleLoadMore = async () => {
    // 1) 현재 items 안에서 아직 안 보여준 카드가 있으면 우선 그거부터
    if (visibleCount < items.length) {
      setVisibleCount((v) => Math.min(v + PAGE_SIZE, items.length));
      return;
    }

    // 2) 서버에서 더 가져올 게 없으면 종료
    if (!serverHasMore) return;

    try {
      setLoadingMore(true);
      const { mapped: next, rawCount } = await fetchPage(nextOffset);

      if (rawCount > 0) {
        const merged = [...allItems, ...next];
        setAllItems(merged);

        const q = query.trim().toLowerCase();
        const afterFilter = q
          ? merged.filter(
              (it) =>
                it.title.toLowerCase().includes(q) ||
                it.excerpt.toLowerCase().includes(q)
            )
          : merged;

        setItems(afterFilter);
        setVisibleCount((v) => Math.min(v + PAGE_SIZE, afterFilter.length));
        setNextOffset(nextOffset + rawCount); // DB offset은 항상 "원본 개수" 기준으로 증가
      } else {
        setServerHasMore(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const onToggleCard = async (a: ArticleEx) => {
    if (!localStorage.getItem("access_token")) {
      openAuth("login");
      return;
    }
    try {
      await toggle(a);
    } catch (e: any) {
      if (e?.code === "NEED_AUTH") openAuth("login");
      else console.error(e);
    }
  };

  // ✅ 아이템이 하나도 없을 때는 더보기 버튼 숨김
  const canShowMore =
    items.length > 0 && (visibleCount < items.length || serverHasMore);

  return (
    <div
      className="w-screen px-4 sm:px-6 lg:px-8 xl:px-14 2xl:px-30"
      style={{ width: "calc(100vw - 52px)" }}
    >
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="뉴스 검색"
        className="mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M20 20l-3.5-3.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="뉴스를 검색해보세요..."
              className="w-full rounded-xl bg-gray-100 border border-gray-200 px-10 py-3 outline-none
                         focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white"
              aria-label="검색어 입력"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl !bg-green-600 text-white px-5 !py-3 font-medium !border-0
             !active:translate-y-px !outline-none !focus:outline-none
             !focus-visible:ring-2 !focus-visible:ring-green-500
             !focus-visible:ring-offset-2 !focus-visible:ring-offset-white"
            aria-label="검색"
            title="검색"
          >
            검색
          </button>
        </div>
      </form>

      <hr className="border-gray-200 mb-6" />

      {loading ? (
        <div className="text-sm text-gray-500">불러오는 중…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">
          표시할 네이버 뉴스가 없습니다.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {items.slice(0, visibleCount).map((a) => (
              <Card
                key={a.id}
                item={a}
                saved={isSaved(a.id)}
                onToggle={() => onToggleCard(a)}
              />
            ))}
          </div>

          {canShowMore && (
            <div className="flex justify-center mt-8">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingMore ? "불러오는 중…" : "더보기"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MainPage;
