import React from "react";
import { Link } from "react-router-dom";
import useBookmarks, { type Article } from "../hook/useBookmarks";

/* ===== 공용 북마크 버튼 (MainPage 동일) ===== */
const BookmarkButton: React.FC<{ saved: boolean; onToggle: () => void }> = ({ saved, onToggle }) => (
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
    style={{ WebkitTapHighlightColor: "transparent", border: "0 none", boxShadow: "none" }}
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
const BookmarkCard: React.FC<{ item: Article; onToggle: (a: Article) => void; saved: boolean }> = ({
  item,
  onToggle,
  saved,
}) => (
  <button
    type="button"
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
      <span className="text-xs text-gray-400">{item.time}</span>
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

    {/* 푸터 */}
    <div className="mt-auto flex items-center justify-between text-sm pt-2">
      <span className="!text-gray-500">{item.press}</span>
      <span className="!text-green-600 font-semibold group-hover:translate-x-0.5 transition">
        <Link to="/Detail" className="!text-green-600">자세히 보기 →</Link>
      </span>
    </div>
  </button>
);

/* ===== 빈 상태 카드 (동일한 구조) ===== */
const EmptyCard: React.FC = () => (
  <div
    className="
      group w-full text-left !bg-white rounded-xl shadow-sm
      transition duration-200 ease-out transform
      hover:shadow-lg active:shadow-lg focus:shadow-lg
      hover:-translate-y-0.5 active:-translate-y-0.5 focus:-translate-y-0.5
      !border-l-4 !border-green-500 !outline-none !focus:outline-none !focus:ring-0
      p-4 h-full flex flex-col justify-between
      min-w-[450px]
    "
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-gray-400">지금</span>
      <span className="-mr-5.5 opacity-60 pointer-events-none">
        <BookmarkButton saved={false} onToggle={() => {}} />
      </span>
    </div>

    <h2 className="mb-2 font-semibold text-gray-800 text-base sm:text-lg">
      북마크가 없습니다
    </h2>

    <p className="text-gray-600 text-sm leading-relaxed mb-4">
      아직 북마크한 뉴스가 없습니다.<br />관심 있는 뉴스를 북마크해보세요.
    </p>

    <div className="mt-auto flex items-center justify-end text-sm pt-2">
      <Link to="/" className="!text-green-600 font-semibold hover:translate-x-0.5 transition">
        뉴스 보러 가기 →
      </Link>
    </div>
  </div>
);

/* ===== 페이지 본문 ===== */
const BookmarkPage: React.FC = () => {
  const { bookmarks, toggle, isSaved } = useBookmarks();

  return (
    <main className="w-full">
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
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-600" fill="none" aria-hidden="true">
              <path d="M7 3h10a1 1 0 0 1 1 1v16l-6-3-6 3V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <h2 className="font-semibold">북마크한 뉴스</h2>
            {bookmarks.length > 0 && <span className="text-xs text-gray-400">({bookmarks.length})</span>}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            관심있는 뉴스를 저장하고 언제든지 다시 확인하세요.
          </p>
        </header>

        <hr className="my-4 sm:my-6 border-gray-200" />

        {/* 반응형 그리드 (MainPage와 완전히 동일) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {bookmarks.length === 0
            ? <EmptyCard />
            : bookmarks.map((a) => (
                <BookmarkCard key={a.id} item={a} saved={isSaved(a.id)} onToggle={toggle} />
              ))}
        </section>
      </div>
    </main>
  );
};

export default BookmarkPage;
