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
  source?: string | null;
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

// 본문/요약 텍스트 정리
const normalizeBodyText = (raw?: string | null): string => {
  if (!raw) return "";
  let t = decodeHTMLEntities(raw);
  t = t.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  t = t.replace(/\\n/g, "\n").replace(/\\t/g, "  ");
  t = t.replace(/\u00a0/g, " ");
  t = t.replace(/\s+/g, " ");
  return t.trim();
};

// 앞에서 N문장만 추출
const firstSentences = (text: string, max = 2): string => {
  const t = normalizeBodyText(text);
  if (!t) return "";
  const bits = t
    .split(/(?<=[\.!?]|…|”|\"|다\.|요\.)\s+/g)
    .map((x) => x.trim())
    .filter(Boolean);
  return bits.slice(0, Math.max(1, max)).join(" ");
};

const toExcerpt = (summary?: string | null, content?: string | null): string => {
  const base = normalizeBodyText(summary) || normalizeBodyText(content);
  if (!base) return "본문 미리보기가 없습니다.";

  const sent = firstSentences(base, 2);
  if (!sent) return "본문 미리보기가 없습니다.";

  // 너무 길면 살짝 자르기
  return sent.length > 90 ? sent.slice(0, 90) + "…" : sent;
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

const extractSourceLabel = (a: ApiArticle): string => {
  // 1) 백엔드에서 source 내려주면 그거 우선
  if (a.source && a.source.trim()) {
    return a.source.trim();
  }

  const raw = (a.link || "").replace(/&amp;/g, "&");

  try {
    const u = new URL(raw);
    let host = (u.hostname || "").toLowerCase();

    host = host.replace(/^(www|m)\./, "");

    const HOST_LABEL_MAP: Record<string, string> = {
      "yonhapnewstv.co.kr": "연합뉴스",
      "chosun.com": "조선일보",
      "news.sbs.co.kr": "SBS",
      "news.jtbc.co.kr": "JTBC",
      "mk.co.kr": "매일경제",
      "ohmynews.com": "오마이뉴스",
      "pressian.com": "프레시안",
      "sisajournal.com": "시사저널",
      "newsis.com": "뉴시스",
      "donga.com": "동아일보",
      "khan.co.kr": "경향신문",
      "kmib.co.kr": "국민일보",
      "hani.co.kr": "한겨레",
      "seoul.co.kr": "서울신문",
    };

    if (HOST_LABEL_MAP[host]) {
      return HOST_LABEL_MAP[host];
    }

    // 매핑 안 된 건 도메인 표시
    return host || "뉴스";
  } catch {
    return "뉴스";
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
            e.preventDefault();
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
        <span className="!text-gray-500">{item.press}</span>
        <span className="!text-green-600 font-semibold group-hover:translate-x-0.5 transition">
          자세히 보기 →
        </span>
      </div>
    </Link>
  );
};

type FetchPageResult = {
  mapped: ArticleEx[];
  rawCount: number;
};

const MainPage: React.FC = () => {
  const [allItems, setAllItems] = React.useState<ArticleEx[]>([]);
  const [items, setItems] = React.useState<ArticleEx[]>([]);
  const [visibleCount, setVisibleCount] = React.useState<number>(PAGE_SIZE);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [nextOffset, setNextOffset] = React.useState(0); // DB offset
  const [serverHasMore, setServerHasMore] = React.useState(true);

  const { isSaved, toggle } = useBookmarks();
  const { open: openAuth } = useAuthDialog();

  const mapArticles = (list: ApiArticle[]): ArticleEx[] => {
    return (list ?? []).map((a) => {
      const link = (a.link || "").replace(/&amp;/g, "&");
      const press = extractSourceLabel(a);

      return {
        id: a.id,
        title: cleanTitle(a.title),
        excerpt: toExcerpt(a.summary, a.content),
        time: a.date ?? "",
        press,
        link,
        content: a.content ? normalizeBodyText(a.content) : null,
      };
    });
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

      const rawCount = j.articles?.length ?? 0;
      const mapped = mapArticles(j.articles ?? []);

      setServerHasMore(rawCount === PAGE_SIZE);

      return { mapped, rawCount };
    },
    []
  );

  React.useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        let offset = 0;
        let acc: ArticleEx[] = [];
        let hasMore = true;

        while (acc.length < PAGE_SIZE && hasMore) {
          const { mapped, rawCount } = await fetchPage(offset);

          if (rawCount === 0) {
            hasMore = false;
            break;
          }

          acc = acc.concat(mapped);
          offset += rawCount;

          if (rawCount < PAGE_SIZE) {
            hasMore = false;
          }
        }

        setAllItems(acc);
        setItems(acc);
        setVisibleCount(Math.min(PAGE_SIZE, acc.length));
        setNextOffset(offset);
        setServerHasMore(hasMore);
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
    if (visibleCount < items.length) {
      setVisibleCount((v) => Math.min(v + PAGE_SIZE, items.length));
      return;
    }

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
        setVisibleCount((v) =>
          Math.min(v + PAGE_SIZE, afterFilter.length)
        );
        setNextOffset(nextOffset + rawCount);
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
          표시할 뉴스가 없습니다.
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
