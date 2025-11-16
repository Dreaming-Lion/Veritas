// src/pages/AboutPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/common/Card";

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <main
        className="
          w-screen min-h-screen
          px-4 sm:px-6 lg:px-8 xl:px-14 2xl:px-30
          bg-gradient-to-b from-white to-green-50
          pt-12 pb-16
        "
        style={{ margin: 0, width: "calc(100vw - 52px)" }}
      >
        <div
          className="
            mx-4 sm:mx-8 md:mx-12 lg:mx-16 xl:mx-24 2xl:mx-36
            flex flex-col items-center gap-8 sm:gap-10  
          "
          style={{ fontFamily: "'SUITE', sans-serif" }}
        >
          {/* 프로젝트 소개 HERO */}
          <section
            className="
              w-full max-w-sm sm:max-w-md md:max-w-lg
              lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl
            "
          >
            <Card glossy>
              <div className="p-6 sm:p-8 lg:p-10 text-center">
                <h1 className="!text-2xl sm:!text-3xl lg:!text-4xl font-extrabold text-green-700">
                  Veritas 프로젝트 소개
                </h1>
                <br />
                <p className="mt-3 text-gray-700 text-sm sm:text-base leading-relaxed max-w-3xl mx-auto">
                  <span className="font-semibold">Veritas</span>는 정치 뉴스를
                  한쪽 시각에 치우치지 않고,<br />다양한 관점에서 바라볼 수 있도록
                  돕는 <span className="font-semibold">미디어 리터러시 플랫폼</span>
                  입니다.
                  <br />
                  <br />
                  현대 사회에서 개인화를 위해 주로 사용되는 추천 알고리즘은
                  사용자의 만족도는 증가시키지만, 자신의 견해가 옳다는 것을
                  확인시켜주는 증거는 적극적으로 찾고, 반박하는 증거는
                  찾으려 하지 않거나 무시하는 경향성인 확증 편향 문제를
                  심화시킵니다. 이로 인해 사람들의 견해가 양극화되고, 자신과
                  다른 의견을 가진 사람들에 대한 이해와 대화가 점점
                  어려워지고 있으며, 자극적인 주장과 가짜 뉴스가 더 잘
                  퍼지면서, 사회 전체의 신뢰와 민주적 의사결정 역시 흔들리고
                  있습니다.
                  <br />
                  <br />
                  Veritas는 이러한 상황 속에서 사용자들이 미디어 리터러시
                  역량을 강화시키고 스스로 판단할 수 있는<br />능력을 기를 수
                  있도록 하는 것을 목표로 합니다.
                  <br />
                  <br />
                  일반적으로 미디어 리터러시 능력을 강화하는 방법에는 자신의
                  견해와 반대되는 의견을 가진 저자의 글을 읽거나,<br />다양한
                  정치 스펙트럼 뉴스 매체를 참고하여 여러 각도에서 생각해 보는
                  비판적 사고 능력을 기르는 것이 있습니다.
                  <br />
                  <br />
                  본 서비스는 사용자가 클릭한 기사 뿐만 아니라, 해당 기사와
                  상반되는 관점의 기사를 함께 제공하며,<br />법안 발의나 뉴스
                  브리핑과 같은 주요 정치 정보에 대해서는 제안 이유와 주요
                  내용이 담긴 원본 자료를 함께 제시하여<br />사용자가 왜곡되지 않은
                  정보를 바탕으로 증거 기반의 정치적 판단을 내릴 수 있도록
                  하고 있습니다.
                  <br />
                </p>

                {/* 버튼 + 설명 중앙 정렬 */}
                <div className="mt-5 flex flex-col sm:flex-row gap-3 items-center justify-center text-center">
                  <Link
                    to="/guide"
                    className="
                      inline-block rounded-full font-semibold px-6 py-3
                      !text-white
                      bg-gradient-to-r from-green-300 via-green-400 to-green-600
                      shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_24px_rgba(22,163,74,0.25)]
                      ring-1 ring-green-400/30
                      hover:from-green-400 hover:via-green-500 hover:to-green-700
                      transition-all duration-200
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-300
                    "
                  >
                    이용 가이드 보러가기
                  </Link>
                </div>
              </div>
            </Card>
          </section>

          {/* 프로젝트 상세 설명 */}
          <section
            className="
              w-full max-w-sm sm:max-w-md md:max-w-lg
              lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl
            "
          >
            <Card>
              <div className="p-6 sm:p-8 lg:p-10 grid gap-6 lg:grid-cols-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-green-700">
                    프로젝트 목표
                  </h2>
                  <ul
                    className="
                      mt-3 space-y-2 text-gray-700 text-sm sm:text-base
                      list-disc list-outside pl-5
                    "
                  >
                    <li>
                      개인화 추천이 심화시키는 확증 편향 문제를 줄이고, 사용자가
                      다양한 관점을 접할 수 있도록 하여 정치적 양극화 문제를
                      완화한다.
                    </li>
                    <li>
                      이를 위해 사용자가 클릭한 기사 뿐만 아니라, 반대 성향의
                      언론사 기사를 함께 추천해 균형 잡힌 정보를 제공한다.
                    </li>
                    <li>
                      정책 브리핑/법률 발의안 관련 뉴스의 경우, 원문 자료를
                      함께 제시하여 사용자가 왜곡된 기사에만 의존하지 않고
                      증거 기반 판단을 내릴 수 있도록 한다.
                    </li>
                    <li>
                      TF-IDF와 NLI 기반의 정교한 기사 추천을 안정적인 응답
                      속도로 제공받을 수 있도록 한다.
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-green-700">
                    핵심 기능
                  </h2>
                  <ul
                    className="
                      mt-3 space-y-2 text-gray-700 text-sm sm:text-base
                      list-disc list-outside pl-5
                    "
                  >
                    <li>기사 데이터를 실시간으로 수집하여 최신 기사 제공</li>
                    <li>기사 요약 기능 제공</li>
                    <li>
                      국내 15개 언론사의 RSS 피드를 활용해 반대 성향 언론사 기사
                      추천 기능 제공
                    </li>
                    <li>
                      정책 브리핑/법률 발의안 등 원문 자료 연동을 통한 공정한
                      판단 유도
                    </li>
                    <li>관심 기사 북마크 기능 제공</li>
                    <li>사용자 문의/피드백을 통한 서비스 개선</li>
                  </ul>
                </div>
              </div>
            </Card>
          </section>

          {/* 팀원 소개 */}
          <section
            className="
              w-full max-w-sm sm:max-w-md md:max-w-lg
              lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl
            "
          >
            <Card>
              <div className="p-6 sm:p-8 lg:p-10">
                <h2 className="text-xl sm:text-2xl font-bold text-green-700 text-center">
                  팀 소개
                </h2>
                <p className="mt-2 mb-6 text-center text-gray-600 text-sm sm:text-base">
                  Veritas는 6명의 개발자가 함께 협업하는 팀 프로젝트입니다.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <TeamCard
                    name="오인화"
                    role="PM · 풀스택"
                    desc={
                      "추천 시스템 개발, \n프론트/백엔드/AI 기능 개발 \n전 과정 참여 및 리딩"
                    }
                  />
                  <TeamCard
                    name="박승현"
                    role="프론트엔드"
                    desc={
                      "프로젝트 설계 과정 참여 및 \nAbout, Guide 페이지 개발 참여"
                    }
                  />
                  <TeamCard
                    name="이유진"
                    role="프론트엔드"
                    desc={
                      "프로젝트 설계 과정 참여 및 \nAbout 페이지 개발 참여"
                    }
                  />
                  <TeamCard
                    name="양정효"
                    role="백엔드"
                    desc={
                      "프로젝트 설계 과정 참여 및 \n로그인 기능 개발 참여"
                    }
                  />
                  <TeamCard
                    name="박민성"
                    role="백엔드"
                    desc={
                      "프로젝트 설계 과정 참여 및 \n북마크 기능 개발 참여"
                    }
                  />
                  <TeamCard
                    name="LIU ZHIYUAN"
                    role="백엔드"
                    desc={"프로젝트 설계 과정 참여"}
                  />
                </div>
              </div>
            </Card>
          </section>

          {/* 마지막 한 줄 소개 */}
          <section
            className="
              w-full max-w-sm sm:max-w-md md:max-w-lg
              lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl
            "
          >
            <Card glossy>
              <div className="p-6 sm:p-8 lg:p-10 text-center">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed max-w-2xl mx-auto">
                  저희는 정치 뉴스 소비가{" "}
                  <span className="font-semibold">
                    조금 더 덜 피곤하고, 조금 더 공정하게
                  </span>{" "}
                  느껴지길 바라며 서비스를 만듭니다.
                  <br className="hidden sm:inline" />
                  앞으로도 더 나은 기능과 경험을 위해 계속해서 실험하고
                  개선하겠습니다.
                </p>
              </div>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;

/** =========================
 *  팀 카드 컴포넌트
 * ========================= */
function TeamCard({
  name,
  role,
  desc,
}: {
  name: string;
  role: string;
  desc: string;
}) {
  const initial = name.slice(0, 1);

  // "\n" (백슬래시+n 또는 실제 개행)을 줄바꿈으로 처리
  const normalizedDesc = desc.replace(/\\n/g, "\n");

  return (
    <div
      className="
        bg-white rounded-2xl shadow-md border border-gray-100
        flex flex-col items-center text-center
        px-6 py-6 sm:px-7 sm:py-7
        transition-transform duration-200
        hover:-translate-y-1 hover:shadow-lg hover:scale-[1.02]
      "
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <span className="text-lg sm:text-xl font-bold text-gray-700">
          {initial}
        </span>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-gray-800">
        {name}
      </h3>
      <p className="mt-0.5 text-xs sm:text-sm text-gray-500">{role}</p>

      <p className="mt-3 text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
        {normalizedDesc}
      </p>
    </div>
  );
}
