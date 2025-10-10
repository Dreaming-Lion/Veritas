// ArticleDetailPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

type ArticleDetail = {
  id: number;
  title: string;
  lead: string;
  time: string;
  press: string;
  originalUrl: string;
  summary: string;
};

type KeyClaim = { text: string };
type OpposingNews = { title: string; excerpt: string; press: string; url?: string };
type BillInfo = { name: string; number: string; status: string; brief: string; url?: string };
type BriefingInfo = { dept: string; date: string; title: string; summary: string; url?: string };

const MOCK = {
  article: {
    id: 1,
    title: "정부, 내년 예산안 총 657조원 규모로 국회 제출",
    lead:
      "정부가 내년도 예산안을 총 657조원 규모로 편성해 국회에 제출했습니다. 전년 대비 2.8% 증가한 규모입니다.",
    time: "2시간 전",
    press: "중앙일보",
    originalUrl: "https://news.example.com/article-1",
    summary:
      "정부가 2025년 예산안을 총 657조 3,000억원 규모로 편성해 국회에 제출했다고 밝혔습니다. 이는 올해 본예산 대비 2.8% 증가한 규모로, 복지와 안전 분야에 중점 투자하겠다는 정부 방침이 반영됐습니다.",
  } as ArticleDetail,
  claim: { text: "복지와 안전 분야 투자 확대를 통한 국민 생활 안정 도모" } as KeyClaim,
  opposing: {
    title: "야당, 657조 예산안 '포퓰리즘' 비판",
    excerpt:
      "야당은 정부 예산안이 재정건전성을 해치는 포퓰리즘 정책이라고 강하게 비판했습니다.",
    press: "한겨레",
    url: "https://news.example.com/opposing-1",
  } as OpposingNews,
  bill: {
    name: "2025년도 예산안",
    number: "제2024-예산-001호",
    status: "국회 제출",
    brief: "2025년도 정부 예산안으로 총 657조 3,000억원 규모",
    url: "#",
  } as BillInfo,
  briefing: {
    dept: "기획재정부",
    date: "2025-09-01",
    title: "2025년도 예산안 정부안 브리핑",
    summary:
      "세출 구조조정과 함께 민생·안전 중심의 투자를 확대한다는 방침. 재정준칙 가이던스 범위 내에서 확장 재정을 운용한다는 계획.",
    url: "#",
  } as BriefingInfo,
};

// 공통 카드
const Card: React.FC<
  React.PropsWithChildren<{ className?: string; interactive?: boolean }>
> = ({ className = "", interactive = false, children }) => (
  <div
    className={[
      "bg-white border border-gray-200 rounded-xl shadow-sm",
      interactive
        ? "transition transform hover:shadow-md active:shadow-lg hover:-translate-y-0.5 active:-translate-y-0.5"
        : "",
      "focus:outline-none focus:ring-0",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

// 섹션 헤더
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  right?: React.ReactNode;
}> = ({ icon, title, right }) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
    <div className="flex items-center gap-2 text-gray-700">
      {icon}
      <h3 className="font-semibold">{title}</h3>
    </div>
    {right}
  </div>
);

// 아이콘
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
  bookOpen: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H11v16H5.5A2.5 2.5 0 0 1 3 17.5v-11Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 6.5A2.5 2.5 0 0 0 18.5 4H13v16h5.5A2.5 2.5 0 0 0 21 17.5v-11Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <path d="M12 9v4m0 4h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.42 3.86a2 2 0 0 0-3.12 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
};

const ArticleDetailPage: React.FC = () => {
  const navi = useNavigate();
  const { article, claim, opposing, bill, briefing } = MOCK;

  return (
    <div className="w-full">
      {/* 컨테이너: 데스크탑에서 거의 꽉 차게 */}
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 max-w-[1600px] 2xl:max-w-[1920px] py-6">
        {/* ===== 상단 헤더 ===== */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <button
              onClick={() => navi(-1)}
              className="inline-flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 transition focus:outline-none focus:ring-0"
            >
              {Icon.back}
              <span>뉴스 목록으로 돌아가기</span>
            </button>
            <span>{article.time}</span>
          </div>

          {/* 제목/리드/출처만 좌측 패딩 추가 */}
          <div className="mt-3 pl-3 sm:pl-4 md:pl-5 lg:pl-6 xl:pl-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              {article.title}
            </h1>
            <p className="mt-3 text-gray-600">{article.lead}</p>
            <p className="mt-3 text-sm text-gray-400">출처: {article.press}</p>
          </div>
        </div>

        {/* 헤더와 본문 구분선 */}
        <hr className="my-6 border-gray-200" />

        {/* ===== 본문 그리드 ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* 좌측(5) : 4개 섹션, 카드 클릭 시 그림자 */}
          <div className="space-y-6 lg:col-span-5">
            <Card interactive>
              <SectionHeader icon={<span className="text-blue-600">{Icon.bookOpen}</span>} title="핵심 주장" />
              <div className="p-4">
                <div className="rounded-lg bg-blue-50/70 border border-blue-100">
                  <div className="border-l-4 border-blue-300 px-4 py-3 text-blue-900/90">
                    {claim.text}
                  </div>
                </div>
              </div>
            </Card>

            <Card interactive>
              <SectionHeader icon={<span className="text-orange-600">{Icon.alert}</span>} title="반대 의견 뉴스" />
              <div className="p-4">
                <div className="rounded-lg bg-orange-50/70 border border-orange-100">
                  <div className="border-l-4 border-orange-300 px-4 py-3">
                    <p className="font-semibold text-orange-900">{opposing.title}</p>
                    <p className="mt-2 text-sm text-orange-800/90">{opposing.excerpt}</p>
                    <p className="mt-3 text-xs text-orange-700/70">출처: {opposing.press}</p>
                    {opposing.url && (
                      <a
                        href={opposing.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-sm !text-orange-700 hover:underline focus:outline-none focus:ring-0"
                      >
                        자세히 보기
                        <svg viewBox="0 0 24 24" className="w-4 h-4"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card interactive>
              <SectionHeader icon={<span className="!text-purple-600">{Icon.bill}</span>} title="관련 법안 정보" />
              <div className="p-4">
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
                        className="block w-full text-center rounded-full bg-white border border-purple-200 py-2 text-sm !text-purple-700 hover:bg-purple-50 transition focus:outline-none focus:ring-0"
                      >
                        관련 법안 자세히 보기
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card interactive>
              <SectionHeader icon={<span className="text-green-600">{Icon.mic}</span>} title="관련 브리핑 정보" />
              <div className="p-4">
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
                        className="inline-flex items-center justify-center gap-1 rounded-full bg-white border border-green-200 px-4 py-2 text-sm !text-green-700 hover:bg-green-50 transition focus:outline-none focus:ring-0"
                      >
                        브리핑 전문 보기
                        <svg viewBox="0 0 24 24" className="w-4 h-4">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* 우측(7) : 뉴스 내용 (높이 더 확장) */}
          <div className="lg:col-span-7">
            <Card className="min-h-[300px] sm:min-h-[300px] lg:min-h-[1080px] xl:min-h-[1015px]">
              <SectionHeader
                icon={
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-700" fill="none">
                    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                }
                title="뉴스 내용"
                right={
                  <a
                    href={article.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm !text-gray-700 hover:bg-gray-50 transition focus:outline-none focus:ring-0"
                  >
                    {Icon.external}
                    뉴스 원문보기
                  </a>
                }
              />
              <div className="p-5">
                <p className="text-gray-700 leading-7">{article.summary}</p>

                <hr className="my-4 border-gray-100" />

                <p className="text-sm text-gray-500">전체 기사는 원문에서 확인하실 수 있습니다.</p>

                <a
                  href={article.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 !text-green-600 font-semibold hover:underline focus:outline-none focus:ring-0"
                >
                  → {article.press} 원문 보러가기
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetailPage;
