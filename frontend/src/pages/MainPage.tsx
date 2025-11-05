// MainPage.tsx
import React from "react";
import useBookmarks, { type Article } from "../hook/useBookmarks";

// 서버 응답 타입 (예시와 동일)
type ApiArticle = {
  title: string;
  content?: string | null;
  summary?: string | null;
  date?: string | null;   // ISO or null
  link: string;
};

type ArticleEx = Article & { link: string };

const idFromLink = (link: string) =>
  Array.from(link).reduce((acc, ch) => (acc * 33 + ch.charCodeAt(0)) >>> 0, 5381);

const BookmarkButton: React.FC<{ saved: boolean; onToggle: () => void }> = ({ saved, onToggle }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onFocus={(e) => (e.currentTarget as HTMLButtonElement).blur()}
    onClick={(e) => { e.stopPropagation(); onToggle(); }}
    className="p-1.5 rounded appearance-none outline-none ring-0 border-0 !bg-transparent"
    aria-label={saved ? "북마크 해제" : "북마크"}
    title={saved ? "북마크 해제" : "북마크"}
  >
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <path d="M7 3h10a1 1 0 0 1 1 1v16l-6-3-6 3V4a1 1 0 0 1 1-1z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            className={saved ? "hidden" : "block text-gray-500"} />
      <path d="M7 3h10a1 1 0 0 1 1 1v16l-6-3-6 3V4a1 1 0 0 1 1-1z"
            className={saved ? "block fill-green-500 text-green-500" : "hidden"} />
    </svg>
  </button>
);

const Card: React.FC<{ item: ArticleEx }> = ({ item }) => {
  const { isSaved, toggle } = useBookmarks();
  const saved = isSaved(item.id);

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group w-full text-left !bg-white rounded-xl shadow-sm transition hover:shadow-lg
                 hover:-translate-y-0.5 p-4 h-full flex flex-col !border-l-4 !border-green-500"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{item.time}</span>
        <span onClick={(e) => e.preventDefault()}>
          <BookmarkButton saved={saved} onToggle={() => toggle(item)} />
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
    </a>
  );
};

const MainPage: React.FC = () => {
  const [items, setItems] = React.useState<ArticleEx[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8001';

        const res = await fetch('/api/article'); 
        const j = await res.json();
        const list: ApiArticle[] = j.articles ?? [];

        const toExcerpt = (a: ApiArticle) => {
          const base = (a.summary ?? a.content ?? "").replace(/\s+/g, " ").trim();
          return base.length > 50 ? base.slice(0, 50) + "…" : base;
        };

        const mapped: ArticleEx[] = list.map((a) => ({
          id: idFromLink(a.link),
          title: a.title,
          excerpt: toExcerpt(a),
          time: a.date ?? "",          // 요청대로: time에는 date 그대로
          press: "네이버 뉴스",        // 요청대로 고정
          link: a.link,                // 카드 전체 a 태그로 연결
        }));

        setItems(mapped);
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 검색 붙일 때 구현
  };

  return (
    <div className="w-screen px-4 sm:px-6 lg:px-8 xl:px-14 2xl:px-30" style={{ width: "calc(100vw - 32px)" }}>
      <form onSubmit={handleSubmit} role="search" aria-label="뉴스 검색" className="mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
            className="rounded-xl bg-green-500 text-white px-5 !py-3 font-medium !bg-green-600 !border-0 active:translate-y-px"
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {items.map((a) => (
            <Card key={a.id} item={a} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MainPage;

