import React from "react";
import { Link } from "react-router-dom";
import useBookmarks, { type Article } from "../hook/useBookmarks";

const DATA: Article[] = [
  { id: 1, title: "尹 '나눠먹기식 재검토하라'…657조 예산안 심사 시작, 쟁점은", excerpt: "정부가 내년도 예산안을 총 657조원 규모로 편성해 국회에 제출했습니다. 전년 대비...", time: "2시간 전", press: "중앙일보" },
  { id: 2, title: "여야, 국정감사 일정 놓고 진통… 핵심 쟁점은", excerpt: "국회 여야가 국정감사 일정을 놓고 이견을 보이며 조율에 난항을 겪고 있습니다. 쟁점은...", time: "4시간 전", press: "한국일보" },
  { id: 3, title: "대통령, 민생 현장 방문… ‘서민 경제 지원’ 강조", excerpt: "대통령이 전통시장을 방문해 상인들과 만나며 서민 경제 지원 방안을 논의했다고 밝혔습니다.", time: "6시간 전", press: "조선일보" },
  { id: 4, title: "국회의원 정수 확대 논의 재점화… 찬반 논란", excerpt: "국회의원 정수를 300명에서 350명으로 늘리자는 논의가 재점화되며 정치권 안팎에서...", time: "8시간 전", press: "동아일보" },
  { id: 5, title: "지방자치단체장들, 중앙정부에 예산 확보 요구", excerpt: "전국 시도지사들이 모여 중앙정부에 지방교부세 증액과 특별교부금 확보를 요구했습니다.", time: "10시간 전", press: "경향신문" },
  { id: 6, title: "물가 상승세 둔화… 에너지 가격 하락 영향", excerpt: "정부 통계에 따르면 최근 물가 상승률이 둔화된 것으로 나타났습니다. 에너지 가격 하락이...", time: "12시간 전", press: "한겨레" },
];

const BookmarkButton: React.FC<{ saved: boolean; onToggle: () => void }> = ({ saved, onToggle }) => {
  return (
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
      style={{ WebkitTapHighlightColor: "transparent", outline: "none", border: "0 none", boxShadow: "none" }}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        {/* outline */}
        <path
          d="M7 3h10a1 1 0 0 1 1 1v16l-6-3-6 3V4a1 1 0 0 1 1-1z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={saved ? "hidden" : "block text-gray-500"}
        />
        {/* filled */}
        <path
          d="M7 3h10a1 1 0 0 1 1 1v16l-6-3-6 3V4a1 1 0 0 1 1-1z"
          className={saved ? "block fill-green-500 text-green-500" : "hidden"}
        />
      </svg>
    </button>
  );
};

const Card: React.FC<{ item: Article }> = ({ item }) => {
  const { isSaved, toggle } = useBookmarks();
  const saved = isSaved(item.id);

  return (
    <button
      type="button"
      className="
        group w-full text-left !bg-white rounded-xl shadow-sm
        transition duration-200 ease-out transform
        hover:shadow-lg active:shadow-lg focus:shadow-lg
        hover:-translate-y-0.5 active:-translate-y-0.5 focus:-translate-y-0.5
        !border-l-4 !border-green-500 !outline-none !focus:outline-none !focus:ring-0
        p-4
        h-full flex flex-col           /* ✅ 카드 높이 통일 */
      "
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{item.time}</span>
        <span className="-mr-5.5 transition group-hover:translate-x-0.5">
          <BookmarkButton saved={saved} onToggle={() => toggle(item)} />
        </span>
      </div>

      {/* 제목: 2줄 고정 높이 */}
      <h2
        className="
          mb-2 font-semibold text-gray-800 group-hover:text-gray-900
          leading-snug line-clamp-2
          min-h-[2.75rem]              /* ✅ 2줄 공간 확보(약 44px) */
        "
      >
        {item.title}
      </h2>

      {/* 요약: 2줄 고정 높이 */}
      <p
        className="
          text-gray-600 text-sm leading-relaxed line-clamp-2
          min-h-[3.25rem]              /* ✅ 2줄 공간 확보(약 52px) */
          mb-4
        "
      >
        {item.excerpt}
      </p>

      {/* 푸터: 항상 바닥에 고정 */}
      <div className="mt-auto flex items-center justify-between text-sm pt-2">
        <span className="!text-gray-500">{item.press}</span>
        <span className="!text-green-600 font-semibold group-hover:translate-x-0.5 transition">
          <Link to="/Detail" className="!text-green-600">자세히 보기 →</Link>
        </span>
      </div>
    </button>
  );
};


const MainPage: React.FC = () => {
  const [query, setQuery] = React.useState(""); // 검색어 상태만 보관(로직은 미구현)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // 나중에 백엔드 붙일 예정이므로 지금은 동작 없음
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-14 2xl:px-30">
      {/* 상단 검색바 */}
      <form onSubmit={handleSubmit} role="search" aria-label="뉴스 검색" className="mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            {/* 돋보기 아이콘 */}
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

      {/* 구분선 */}
      <hr className="border-gray-200 mb-6" />

      {/* 카드 그리드 (반응형 원형 유지) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {DATA.map((a) => (
          <Card key={a.id} item={a} />
        ))}
      </div>
    </div>
  );
};

export default MainPage;
