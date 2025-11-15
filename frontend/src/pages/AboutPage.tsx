// src/pages/AboutPage.tsx
import React from "react";
import { Link } from "react-router-dom";

const AboutPage: React.FC = () => {
  return (
    <div
      className="min-h-screen w-screen bg-gray-50 px-4 sm:px-6 lg:px-8 xl:px-14 2xl:px-30"
      style={{ width: "calc(100vw - 34px)" }}
    >
      <header className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md">
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path
                  d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                  strokeLinejoin="round"
                />
                <path d="M14 3v5h5" strokeLinejoin="round" />
                <path d="M10 13h6M10 17h4" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <h1 className="text-3xl font-bold">About</h1>
              <p className="text-sm text-white/90 mt-1">
                베리타스(Veritas) 문의 및 서비스 안내 페이지입니다. 문의 기능과
                답변 확인 방법, 연락처 정보를 한눈에 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </header>
      <main className="w-full flex justify-center px-4 py-8">
        <div className="w-full max-w-6xl">
          {/* 문의하기 / 나의 문의 목록 카드 영역 */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* 문의하기 */}
            <article className="bg-white rounded-2xl shadow-sm border border-green-200 overflow-hidden flex flex-col">
              {/* 카드 헤더 */}
              <div className="px-6 py-4 bg-green-50 border-b border-green-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center text-green-600 shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                    <rect
                      x="4"
                      y="3"
                      width="16"
                      height="18"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M8 8h8M8 12h6M8 16h4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    문의하기
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    서비스 이용 중 오류나 개선 사항이 있을 때 남겨주세요.
                  </p>
                </div>
              </div>

              {/* 카드 본문 */}
              <div className="px-6 py-5 flex-1 text-sm text-gray-700 leading-relaxed space-y-2">
                <p>
                  서비스 이용 중 궁금한 점이나 오류, 개선 의견이 있으신가요? <br />
                  문의 게시판에 자유롭게 의견을 남겨주시면 운영팀이 확인 후 답변드립니다.
                </p>
                <ul className="space-y-1">
                  <li>
                    ·{" "}
                    <span className="text-green-600 font-semibold">
                      로그인 후 이용 가능
                    </span>
                  </li>
                  <li>· 첨부 파일 업로드 가능 (최대 10MB)</li>
                  <li>· 1–2 영업일 이내 답변 (상황에 따라 변동 가능)</li>
                </ul>
              </div>

              {/* 카드 하단 버튼 – 배경 초록 + 글씨 흰색 고정 */}
              <div className="px-6 pb-6 pt-1">
                <Link
                  to="/inquiry"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 !text-white text-sm font-semibold py-3 hover:bg-green-700 hover:!text-white transition"
                >
                  문의 작성하기
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                    <path
                      d="M7 12h10M13 8l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            </article>

            {/* 나의 문의 목록 */}
            <article className="bg-white rounded-2xl shadow-sm border border-green-200 overflow-hidden flex flex-col">
              {/* 카드 헤더 */}
              <div className="px-6 py-4 bg-green-50 border-b border-green-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center text-green-600 shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                    <path
                      d="M5 6h14M5 12h14M5 18h10"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    나의 문의 목록
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    내가 작성한 문의 내역을 한곳에서 관리합니다.
                  </p>
                </div>
              </div>

              {/* 카드 본문 */}
              <div className="px-6 py-5 flex-1 text-sm text-gray-700 leading-relaxed space-y-2">
                <p>
                  지금까지 올린 문의 내역을 한 화면에서 확인하고, <br />
                  상태별로 정리된 목록을 확인할 수 있습니다.
                </p>
                <ul className="space-y-1">
                  <li>
                    ·{" "}
                    <span className="text-green-600 font-semibold">
                      로그인 후 이용 가능
                    </span>
                  </li>
                  <li>· 답변 상태 확인 (대기 / 답변완료 / 종결)</li>
                  <li>· 문의 내용 수정 및 삭제 가능</li>
                  <li>· 본인이 작성한 문의만 관리 가능</li>
                </ul>
              </div>

              {/* 카드 하단 버튼 – 배경 초록 + 글씨 흰색 고정 */}
              <div className="px-6 pb-6 pt-1">
                <Link
                  to="/inquiry/list"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 !text-white text-sm font-semibold py-3 hover:bg-green-700 hover:!text-white transition"
                >
                  문의 목록 보기
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                    <path
                      d="M8 5h11M8 12h11M8 19h11"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </Link>
              </div>
            </article>
          </section>

          {/* 연락처 정보 섹션 */}
          <section className="mb-12">
            <article className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
              <div className="px-6 py-4 bg-green-50 border-b border-green-100 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  연락처 정보
                </span>
              </div>

              <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-green-100 bg-white">
                  <div className="text-xs font-semibold text-green-600 mb-1">
                    이메일
                  </div>
                  <div className="text-sm text-gray-800 break-all">
                    이메일작성
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-green-100 bg-white">
                  <div className="text-xs font-semibold text-green-600 mb-1">
                    운영시간
                  </div>
                  <div className="text-sm text-gray-800">평일 09:00 - 18:00</div>
                </div>

                <div className="p-4 rounded-xl border border-green-100 bg-white">
                  <div className="text-xs font-semibold text-green-600 mb-1">
                    응답 시간
                  </div>
                  <div className="text-sm text-gray-800">
                    1-2 영업일 이내 (상황에 따라 변동 가능)
                  </div>
                </div>
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
};


export default AboutPage;
