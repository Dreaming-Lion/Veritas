import React, { useState } from "react";
import { Link } from "react-router-dom";

type Article = {
  id: number;
  title: string;
  excerpt: string;
  time: string;
  press: string;
};

const DATA: Article[] = [
  { id: 1, title: "정부, 내년 예산안 총 657조원 규모로 국회 제출", excerpt: "정부가 내년도 예산안을 총 657조원 규모로 편성해 국회에 제출했습니다. 전년 대비...", time: "2시간 전", press: "중앙일보" },
  { id: 2, title: "여야, 국정감사 일정 놓고 진통… 핵심 쟁점은", excerpt: "국회 여야가 국정감사 일정을 놓고 이견을 보이며 조율에 난항을 겪고 있습니다. 쟁점은...", time: "4시간 전", press: "한국일보" },
  { id: 3, title: "대통령, 민생 현장 방문… ‘서민 경제 지원’ 강조", excerpt: "대통령이 전통시장을 방문해 상인들과 만나며 서민 경제 지원 방안을 논의했다고 밝혔습니다.", time: "6시간 전", press: "조선일보" },
  { id: 4, title: "국회의원 정수 확대 논의 재점화… 찬반 논란", excerpt: "국회의원 정수를 300명에서 350명으로 늘리자는 논의가 재점화되며 정치권 안팎에서...", time: "8시간 전", press: "동아일보" },
  { id: 5, title: "지방자치단체장들, 중앙정부에 예산 확보 요구", excerpt: "전국 시도지사들이 모여 중앙정부에 지방교부세 증액과 특별교부금 확보를 요구했습니다.", time: "10시간 전", press: "경향신문" },
  { id: 6, title: "물가 상승세 둔화… 에너지 가격 하락 영향", excerpt: "정부 통계에 따르면 최근 물가 상승률이 둔화된 것으로 나타났습니다. 에너지 가격 하락이...", time: "12시간 전", press: "한겨레" },
];

const BookmarkButton: React.FC<{
  saved: boolean;
  onToggle: () => void;
}> = ({ saved, onToggle }) => {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // 클릭 시 포커스 방지
      onFocus={(e) => (e.currentTarget as HTMLButtonElement).blur()} // 혹시 포커스가 잡혀도 즉시 해제
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="p-1.5 rounded hover:bg-gray-100 transition
                 appearance-none
                 outline-none focus:outline-none focus-visible:outline-none
                 ring-0 focus:ring-0 focus-visible:ring-0
                 border-0 focus:border-0 active:border-0"
      aria-label={saved ? "북마크 해제" : "북마크"}
      title={saved ? "북마크 해제" : "북마크"}
      style={{ WebkitTapHighlightColor: "transparent", outline: "none", border: "0 none", boxShadow: "none" }}
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
};

const Card: React.FC<{ item: Article }> = ({ item }) => {
  const [saved, setSaved] = useState(false);

  return (
    <button
      type="button"
      className="
        group w-full text-left bg-white rounded-xl shadow-sm
        transition duration-200 ease-out transform
        hover:shadow-lg active:shadow-lg focus:shadow-lg
        hover:-translate-y-0.5 active:-translate-y-0.5 focus:-translate-y-0.5
        !border-l-4 !border-green-500
        !outline-none !focus:outline-none !focus:ring-0
        p-4
      "
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{item.time}</span>
        <BookmarkButton saved={saved} onToggle={() => setSaved((s) => !s)} />
      </div>

      <h2 className="mb-2 font-semibold text-gray-800 group-hover:text-gray-900">
        {item.title}
      </h2>

      <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">
        {item.excerpt}
      </p>

      <div className="flex items-center justify-between text-sm">
        <span className="!text-gray-500">{item.press}</span>
        <span className="text-green-600 font-semibold group-hover:translate-x-0.5 transition">
            <Link to="/Detail">
          자세히 보기 →
          </Link>
        </span>
      </div>
    </button>
  );
};

const MainPage: React.FC = () => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {DATA.map((a) => (
          <Card key={a.id} item={a} />
        ))}
      </div>
    </div>
  );
};

export default MainPage;
