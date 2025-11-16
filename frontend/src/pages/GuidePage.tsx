// src/pages/GuidePage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Card, FeatureCard } from "../components/common/Card";

const GuidePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <main
        className="
          w-screen min-h-screen
          px-4 sm:px-6 lg:px-8 xl:px-14 2xl:px-30
          pt-12 pb-16              
        "
        style={{ margin: 0, width: "calc(100vw - 52px)" }}  
      >
        {/* InquiryPage와 같은 바깥 컨테이너 */}
        <div
          className="
            mx-4 sm:mx-8 md:mx-12 lg:mx-16 xl:mx-24 2xl:mx-36
            flex flex-col items-center gap-6
          "
          style={{ fontFamily: "'SUITE', sans-serif" }}
        >
          {/* HERO 카드 */}
          <section
            className="
              w-full max-w-sm sm:max-w-md md:max-w-lg
              lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl
            "
          >

          <Card glossy>
            <div className="p-6 sm:p-8 lg:p-10 text-center">
              <h1 className="!text-2xl sm:!text-3xl lg:!text-4xl font-extrabold text-green-700">
                Veritas 이용 가이드
              </h1>
              <p className="mt-3 text-gray-600">
                Veritas는 미디어 리터러시 역량 강화를 위한 정치 뉴스 플랫폼입니다.
              </p>
              <Link
                to="/"
                className="
                  mt-5 inline-block rounded-full font-semibold px-6 py-3
                  !text-white
                  bg-gradient-to-r from-green-300 via-green-400 to-green-600
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_24px_rgba(22,163,74,0.25)]
                  ring-1 ring-green-400/30
                  hover:from-green-400 hover:via-green-500 hover:to-green-700
                  transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-300
                "
              >
                지금 바로 이용하기
              </Link>
            </div>
          </Card>

          </section>

          {/* FEATURES 섹션 */}
          <section
            className="
              w-full max-w-sm sm:max-w-md md:max-w-lg
              lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl
            "
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
              <FeatureCard icon="src/assets/icon-trust-green.svg" title="신뢰성 있는 정보">
                국내 15개 주요 언론사의 RSS 및 <br />
                신뢰성 있는 1차 자료를 활용하여 <br />
                추천 시스템을 제공해요.
              </FeatureCard>

              <FeatureCard icon="src/assets/icon-bookmark-green.svg" title="개인 맞춤 북마크">
                관심 있는 기사를 북마크하고, <br />
                나만의 정치 뉴스 컬렉션을 <br />
                모아볼 수 있어요.
              </FeatureCard>

              <FeatureCard icon="src/assets/icon-realtime-green.svg" title="실시간 업데이트">
                새로운 기사가 실시간으로 <br />
                업데이트 되므로 언제든 <br />
                최신 뉴스를
                확인할 수 있어요.
              </FeatureCard>
            </div>
          </section>

          {/* FAQ */}
          <section
            className="
              w-full max-w-sm sm:max-w-md md:max-w-lg
              lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl
            "
          >
            <Card>
              <div className="p-6 sm:p-8 lg:p-10">
                <h3 className="text-xl font-bold text-green-700">자주 묻는 질문</h3>
                <dl className="mt-4 space-y-4">
                  <QA
                    q="베리타스(Veritas)는 어떤 서비스인가요?"
                    a="Veritas는 한국의 정치 뉴스를 모아 제공하고, 사용자가 클릭한 기사와 반대되는 성향을 지닌 언론사의 뉴스 기사를 제공하는 정치 뉴스 플랫폼입니다. 객관적이고 신뢰할 수 있는 정보를 통해 시민들의 정치 참여를 돕고, 다양한 관점을 제공하여 건전한 정치 토론 문화를 만들어가는 것을 목표로 하고 있습니다."
                  />
                  <QA
                    q="뉴스는 어디에서 가져오나요?"
                    a="오마이뉴스, 한겨레, 프레시안, 경향신문, JTBC, 조선일보, 동아일보, 매일경제, 국민일보, 뉴시스, 서울신문, 연합뉴스, SBS, 여성신문, 시사저널 등 15개 언론사의 RSS 피드를 활용해 뉴스 데이터를 제공합니다.
                    모든 뉴스는 출처가 명확히 표시되며, 각 뉴스 카드 하단의 '원문 보기'를 클릭하면 언론사의 전체 원문 내용을 확인할 수 있습니다."
                  />
                  <QA
                    q="신뢰성 있는 1차 자료가 무엇인가요?"
                    a="문화체육관광부에서 제공하는 정책 브리핑 연설문/보도 자료/정책 뉴스 자료와 국회 사무처에서 제공하는 국회의원 법률 발의안 자료를 의미합니다.
                    사용자가 정책 브리핑 혹은 법률 발의안 관련 뉴스를 볼 때 1차 자료가 함께 제시되도록 하여 실제 발의 혹은 브리핑 된 내용이 왜곡되지 않고 원문 그대로 사용자에게 전달될 수 있도록 하고 있습니다."
                  />
                  <QA
                    q="북마크는 어디서 확인할 수 있나요?"
                    a="상단 메뉴의 Bookmarks 페이지에서 내가 저장한 모든 콘텐츠를 한눈에 볼 수 있습니다."
                  />
                  <QA
                    q="로그인해야만 사용할 수 있나요?"
                    a="일부 기능은 비회원도 이용 가능하지만, 북마크 저장, 문의 등록 등의 기능들은 로그인 후 이용할 수 있습니다."
                  />
                  <QA
                    q="문의 답변은 어디서 확인하나요?"
                    a="「Inquiry」에서 등록한 문의는 회원가입 시 사용한 이메일로 답변이 전송되며,「Inquiry List」에서 답변 여부를 확인할 수 있습니다."
                  />
                </dl>
              </div>
            </Card>
          </section>

          {/* FINAL CTA */}
          <section
            className="
              w-full max-w-sm sm:max-w-md md:max-w-lg
              lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl
            "
          >
            <Card glossy>
              <div className="p-6 sm:p-8 lg:p-10 text-center">
                <h3 className="text-2xl font-bold text-green-700">이제 시작해볼까요?</h3>
                <p className="mt-2 text-gray-600">
                  궁금한 점이나 개선 아이디어가 있다면 언제든지
                  저희에게 연락해 주세요! <br />
                  모든 의견을 열린 마음으로 수용하겠습니다.
                </p>
                <Link
                  to="/inquiry"
                  className="
                    mt-5 inline-block rounded-full !text-white font-semibold px-6 py-3
                    bg-gradient-to-r from-green-300 via-green-400 to-green-600
                    ring-1 ring-green-400/30
                    hover:from-green-400 hover:via-green-500 hover:to-green-700
                    transition-colors duration-200
                  "
                >
                  문의하기
                </Link>
              </div>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
};

export default GuidePage;

/** =========================
 *  Small bits
 * ========================= */
function Legend({
  color,
  title,
  desc,
}: {
  color: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-green-100/60 bg-white/90 p-4">
      <span
        className={`inline-block rounded-2xl px-2.5 py-1 text-sm font-semibold ${color}`}
      >
        {title}
      </span>
      <p className="mt-2 text-sm text-gray-700">{desc}</p>
    </div>
  );
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl border border-green-100/60 bg-white/90 p-4">
      <dt className="font-semibold text-slate-800">Q. {q}</dt>
      <dd className="mt-1 text-gray-700">A. {a}</dd>
    </div>
  );
}
