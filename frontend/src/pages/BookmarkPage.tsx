// src/pages/BookmarkPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import useBookmarks, { type Article } from "../hook/useBookmarks";

/* ===== 상대시간 포맷(메인과 동일) ===== */
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
  if (diffMs < m)        return `${Math.floor(diffMs / 1000)}초 전`;
  if (diffMs < h)        return `${Math.floor(diffMs / m)}분 전`;
  if (diffMs < day)      return `${Math.floor(diffMs / h)}시간 전`;
  if (diffMs < week)     return `${Math.floor(diffMs / day)}일 전`;
  if (diffMs < 30 * day) return `${Math.floor(diffMs / week)}주 전`;

  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${yy}.${mm}.${dd} ${hhmm}`;
};

/* 1분마다 강제 리렌더 → 상대시간 갱신 */
const useNowTick = (intervalMs = 60_000) => {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
};

/* ===== 공용 북마크 버튼 ===== */
const BookmarkButton: React.FC<{ saved: boolean; onToggle: () => void }> = ({
  saved,
  onToggle,
}) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onFocus={(e) => (e.currentTarget as HTMLButtonElement).blur()}
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    className="p-1.5 rounded transition
               appearance-none outline-none ring-0 border-0
               !bg-transparent !hover:bg-transparent !active:bg-transparent !focus:bg-transparent"
    aria-label={saved ? "북마크 해제" : "북마크"}
    title={saved ? "북마크 해제" : "북마크"}
    style={{
      WebkitTapHighlightColor: "transparent",
      border: "0 none",
      boxShadow: "none",
    }}
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

/* ===== 뉴스 카드 ===== */
const BookmarkCard: React.FC<{
  item: Article;
  onToggle: (a: Article) => void;
  saved: boolean;
}> = ({ item, onToggle, saved }) => {
  useNowTick();
  const relative = formatRelativeKorean(item.time);

  return (
    <div
      className="
        group w-full text-left !bg-white rounded-xl shadow-sm
        transition duration-200 ease-out transform
        hover:shadow-lg active:shadow-lg focus:shadow-lg
        hover:-translate-y-0.5 active:-translate-y-0.5 focus:-translate-y-0.5
        !border-l-4 !border-green-500 !outline-none !focus:outline-none !focus:ring-0
        p-4 h-full flex flex-col
      "
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{relative}</span>
        <span className="-mr-5.5 transition group-hover:translate-x-0.5">
          <BookmarkButton saved={saved} onToggle={() => onToggle(item)} />
        </span>
      </div>

      {/* 제목 */}
      <h2
        className="
          mb-2 font-semibold text-gray-800 group-hover:text-gray-900
          leading-snug line-clamp-2
          min-h-[2.75rem]
        "
      >
        {item.title}
      </h2>

      {/* 요약 */}
      <p
        className="
          text-gray-600 text-sm leading-relaxed line-clamp-2
          min-h-[3.25rem] mb-4
        "
      >
        {item.excerpt}
      </p>

      <div className="mt-auto flex items-center justify-between text-sm pt-2">
        <span className="!text-gray-500">{item.press}</span>
        <span className="!text-green-600 font-semibold group-hover:translate-x-0.5 transition">
          {/* ✅ 메인과 동일: 해당 기사로 이동 + state 전달 */}
          <Link
            to={`/Detail/${item.id}`}
            state={{ item }}
            className="!text-green-600"
            aria-label="자세히 보기"
          >
            자세히 보기 →
          </Link>
        </span>
      </div>
    </div>
  );
};

const EmptyCard: React.FC = () => (
  <div className="flex items-center justify-center h-[55vh] w-full">
    <div
      className="
        bg-white border border-gray-200 rounded-xl shadow-md
        p-8 text-center max-w-sm w-full
        flex flex-col items-center justify-center
      "
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-9 h-9 mb-2 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.6}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 3h10a1 1 0 0 1 1 1v16l-6-3-6 3V4a1 1 0 0 1 1-1z"
        />
      </svg>

      <h2 className="text-lg font-semibold text-gray-800 mb-1">
        북마크가 없습니다
      </h2>
      <p className="text-sm text-gray-500 mb-3 leading-relaxed">
        아직 북마크한 뉴스가 없습니다.
        <br />
        관심있는 뉴스를 북마크해보세요.
      </p>

      <Link
        to="/"
        className="!text-green-600 font-semibold hover:underline mt-1"
      >
        뉴스 보러 가기 →
      </Link>
    </div>
  </div>
);

/* ===== 페이지 본문 ===== */
const BookmarkPage: React.FC = () => {
  const { bookmarks, toggle, isSaved } = useBookmarks();

  return (
    <main
      className="w-full bg-white"
      style={{ width: "calc(100vw - 52px)" }}
    >
      <div
        className="
          w-full mx-auto
          px-4 sm:px-6 lg:px-8 xl:px-14 2xl:px-30
          max-w-screen-xl lg:max-w-screen-2xl 2xl:max-w-[1920px]
          xl:max-w-none 2xl:max-w-none
        "
      >
        {/* 헤더 */}
        <header className="mb-4 sm:mb-5 lg:mb-6 text-center">
          <div className="inline-flex items-center justify-center gap-2 text-gray-700">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-green-600"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7 3h10a1 1 0 0 1 1 1v16l-6-3-6 3V4a1 1 0 0 1 1-1z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
            <h2 className="font-semibold">북마크한 뉴스</h2>
            {bookmarks.length > 0 && (
              <span className="text-xs text-gray-400">
                ({bookmarks.length})
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            관심있는 뉴스를 저장하고 언제든지 다시 확인하세요.
          </p>
        </header>

        <hr className="my-4 sm:my-6 border-gray-200" />

        {/* 콘텐츠 영역 */}
        <section
          className={
            bookmarks.length === 0
              ? "flex items-center justify-center w-full"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
          }
        >
          {bookmarks.length === 0 ? (
            <EmptyCard />
          ) : (
            bookmarks.map((a) => (
              <BookmarkCard
                key={a.id}
                item={a}
                saved={isSaved(a.id)}
                onToggle={toggle}
              />
            ))
          )}
        </section>
      </div>
    </main>
  );
};

export default BookmarkPage;
