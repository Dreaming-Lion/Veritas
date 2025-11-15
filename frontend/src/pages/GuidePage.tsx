  // src/pages/GuidePage.tsx
  // Veritas 서비스 이용 안내 페이지

  import React from "react";

  type FeatureType = "home" | "bookmark" | "guide" | "about" | "mypage";

  const FeatureIcon: React.FC<{ type: FeatureType }> = ({ type }) => {
    const common = "w-8 h-8 text-white";

    switch (type) {
      case "home":
        return (
          <svg
            viewBox="0 0 24 24"
            className={common}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z" />
          </svg>
        );
      case "bookmark":
        return (
          <svg
            viewBox="0 0 24 24"
            className={common}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M7 3h10a1 1 0 0 1 1 1v16l-6-3-6 3V4a1 1 0 0 1 1-1z" />
          </svg>
        );
      case "guide":
        return (
          <svg
            viewBox="0 0 24 24"
            className={common}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="9" />
            <path
              d="M11 8.8a2.1 2.1 0 0 1 3.3 1.6c0 1-.6 1.5-1.3 1.8-.6.3-1 .7-1 1.5v.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="17.1" r="0.9" fill="currentColor" />
          </svg>
        );
      case "about":
        // 문의/질문 페이지를 나타내는 문서 아이콘
        return (
          <svg
            viewBox="0 0 24 24"
            className={common}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
              strokeLinejoin="round"
            />
            <path d="M14 3v5h5" strokeLinejoin="round" />
            <path d="M10 13h6M10 17h4" strokeLinecap="round" />
          </svg>
        );
      case "mypage":
        return (
          <svg
            viewBox="0 0 24 24"
            className={common}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  const GuidePage: React.FC = () => {
    // 상단 기능 카드 데이터
    const features: {
      type: FeatureType;
      title: string;
      description: string;
    }[] = [
      {
        type: "home",
        title: "Home - 뉴스 피드",
        description:
          "메인 화면에서는 최신 화제의 정치 뉴스들이 카드 형태로 나열됩니다. 각 뉴스에는 정치 성향 표시(민주당/국민의힘/중립), 키워드 태그, 독자 반응 통계가 함께 표시되어 한눈에 뉴스 내용을 파악할 수 있습니다.",
      },
      {
        type: "bookmark",
        title: "BookMark - 저장 관리",
        description:
          "관심있는 뉴스를 북마크하여 나중에 다시 확인할 수 있습니다. 북마크 페이지에서는 저장한 모든 뉴스를 한눈에 보고 관리할 수 있으며, 중요한 정치 이슈를 놓치지 않고 추적할 수 있습니다.",
      },
      {
        type: "guide",
        title: "Guide - 이용 안내",
        description:
          "베리타스 플랫폼의 모든 기능과 사용 방법을 안내하는 페이지입니다. 각 페이지별 상세 기능 설명, 단계별 사용 가이드, 자주 묻는 질문(FAQ), 안전한 이용을 위한 가이드라인 등을 확인할 수 있습니다.",
      },
      {
        type: "about",
        title: "About - 문의 / 질문",
        description:
          "서비스 이용 중 궁금한 점이나 문제를 문의할 수 있는 페이지입니다. 나의 질문과 답변을 한눈에 볼 수 있는 문의 목록이 있으며, 나만의 질문글을 직접 작성해 등록할 수도 있습니다.",
      },
      {
        type: "mypage",
        title: "MyPage - 개인 설정",
        description:
          "회원가입 후 이용할 수 있는 개인 페이지입니다. 프로필 정보 수정, 비밀번호 변경, 저장한 북마크 관리, 뉴스 읽기 기록, 관심 키워드 설정 등 개인화된 서비스를 이용할 수 있습니다.",
      },
    ];

    // FAQ 목록
    const faqs = [
      {
        question: "베리타스(Veritas)는 어떤 서비스인가요?",
        answer:
          "베리타스는 라틴어로 '진실'을 의미하며, 한국의 정치 관련 뉴스를 모아서 보여주고 각 뉴스에 대한 독자들의 반응과 검증된 근거 자료를 제공하는 정치 뉴스 플랫폼입니다. 객관적이고 신뢰할 수 있는 정보를 통해 시민들의 정치 참여를 돕고, 다양한 관점을 제공하여 건전한 정치 토론 문화를 만들어가는 것이 목표입니다.",
      },
      {
        question: "뉴스는 어디에서 가져오나요?",
        answer:
          "주요 언론사(중앙일보, 한국일보, 조선일보, 동아일보, 경향신문, 한겨레, 연합뉴스 등)의 정치 관련 뉴스를 수집하여 제공합니다. 모든 뉴스는 출처가 명확히 표시되며, 각 뉴스 카드 하단의 '원문 보기' 링크를 통해 언론사의 전체 원문 내용을 확인할 수 있습니다.",
      },
      {
        question: "독자 반응은 어떻게 수집되나요?",
        answer:
          "각 뉴스에 대한 독자들의 반응(긍정적/부정적/중립적)을 수집하여 통계로 보여줍니다. 뉴스 상세 페이지에서는 퍼센테지와 진행 바 형태로 시각화되어 표시되며, 이를 통해 해당 뉴스에 대한 여론의 동향을 파악할 수 있습니다.",
      },
      {
        question: "검증된 근거란 무엇인가요?",
        answer:
          "각 뉴스와 관련된 공식 발표자료, 정부 문서, 국회 자료, 법안 정보 등 신뢰할 수 있는 1차 자료들을 의미합니다. 뉴스 상세 페이지의 '검증된 근거' 섹션에서 확인할 수 있으며, 이를 통해 뉴스의 정확성을 높이고 가짜 뉴스나 왜곡된 정보를 방지합니다.",
      },
      {
        question: "반대 의견 뉴스 요약은 무엇인가요?",
        answer:
          "하나의 이슈에 대해 반대되는 관점이나 다른 정치 성향의 뉴스 내용을 요약하여 보여주는 기능입니다. 이를 통해 한쪽 관점만 보는 것이 아니라 양쪽의 주장을 모두 확인하고 균형잡힌 시각을 가질 수 있습니다.",
      },
      {
        question: "뉴스의 정치 성향 색깔은 어떻게 구분되나요?",
        answer:
          "각 뉴스는 내용과 출처를 분석하여 정치 성향을 구분합니다. 민주당 성향의 뉴스는 파란색, 국민의힘 성향의 뉴스는 빨간색, 중립적인 뉴스는 초록색으로 표시됩니다.",
      },
      {
        question: "주요 사건 중심 뉴스는 무엇인가요?",
        answer:
          "홈페이지 상단에 배치된 특별 섹션으로, 현재 가장 많은 관심을 받고 있는 중요한 정치 사건과 이슈들을 큰 카드 형태로 강조하여 보여줍니다.",
      },
      {
        question: "관련 법안 정보는 어떻게 활용하나요?",
        answer:
          "뉴스 상세 페이지의 '관련 법안 정보' 섹션에서는 해당 뉴스와 연관된 국회 법안의 내용, 발의자, 진행 상황 등을 확인할 수 있습니다.",
      },
      {
        question: "회원가입 없이도 사용할 수 있나요?",
        answer:
          "네, 뉴스 조회, 검색, 통계 확인 등 대부분의 기능은 회원가입 없이도 이용 가능합니다. 다만 북마크 기능, 자유게시판 글 작성, 댓글 달기 등의 기능은 회원가입이 필요합니다.",
      },
    ];

    return (
      <div
        className="min-h-screen w-screen bg-gray-50 px-4 sm:px-6 lg:px-8 xl:px-14 2xl:px-30"
        style={{ width: "calc(100vw - 34px)" }}
      >
        {/* 상단 헤더 영역 */}
        <header className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3">
              {/* 왼쪽 아이콘 박스 */}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md">
                <svg
                  viewBox="0 0 24 24"
                  className="w-7 h-7 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    d="M11 8.8a2.1 2.1 0 0 1 3.3 1.6c0 1-.6 1.5-1.3 1.8-.6.3-1 .7-1 1.5v.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="17.1" r="0.9" fill="currentColor" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Guide</h1>
                <p className="text-sm text-white/90 mt-1">
                  베리타스(Veritas) 정치 뉴스 플랫폼 완벽 가이드
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* 본문: 가운데 정렬 컨테이너 */}
        <main className="w-full flex justify-center px-4 py-8">
          <div className="w-full max-w-6xl">
            {/* 1. 환영 섹션 */}
            <section className="mb-10 border-2 border-green-200 rounded-2xl shadow-md bg-white">
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 3 9.8 9.2H4.5l4.3 3.1-1.7 6.2L12 15l4.9 3.5-1.7-6.2 4.3-3.1h-5.3L12 3Z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-green-900">
                  베리타스에 오신 것을 환영합니다!
                </h2>
                <p className="text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
                  Veritas(베리타스)는 라틴어로 <strong>&apos;진실&apos;</strong>을
                  의미합니다. 신뢰할 수 있는 정치 뉴스와 다양한 관점을 제공하여
                  건전한 정치 토론 문화를 만들어가는 것을 목표로 합니다.
                </p>
                <p className="text-gray-500 text-sm mb-6 max-w-2xl mx-auto">
                  아래에서 각 메뉴의 역할과 이용 방법, 자주 묻는 질문까지 한 번에
                  확인할 수 있습니다.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm">
                    객관적 정보
                  </span>
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm">
                    검증된 근거
                  </span>
                  <span className="px-3 py-1 bg-lime-600 text-white rounded-full text-sm">
                    열린 토론
                  </span>
                  <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm">
                    다양한 관점
                  </span>
                </div>
              </div>
            </section>

            {/* 2. 페이지별 기능 카드 */}
            <section className="mb-12">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  페이지별 상세 기능 안내
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <article
                    key={index}
                    className="border-2 border-lime-300 bg-lime-50 rounded-2xl shadow-sm hover:shadow-md transition-all p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center shadow-sm">
                        <FeatureIcon type={feature.type} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* 3. 사용 방법(단계별 가이드) */}
            <section className="mb-12 border-2 border-green-200 rounded-2xl shadow-md bg-white">
              <div className="bg-green-50 p-6 rounded-t-2xl">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <span>📈</span> 사용 방법 - 단계별 가이드
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-medium">
                    1
                  </div>
                  <div className="flex-1 bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-bold mb-2 text-green-900">
                      뉴스 탐색 및 검색
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      홈페이지에서 최신 정치 뉴스를 확인하거나 상단 검색 기능으로
                      특정 주제의 뉴스를 찾아보세요. 관심 있는 키워드로 필터링해
                      자신만의 뉴스 피드를 만들 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-medium">
                    2
                  </div>
                  <div className="flex-1 bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <h4 className="font-bold mb-2 text-emerald-900">
                      뉴스 상세 정보 확인
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      뉴스를 클릭하면 본문, 독자 반응, 검증된 근거, 반대 의견 등을
                      함께 볼 수 있습니다. 한 화면에서 여러 관점을 비교하면서 뉴스를
                      읽을 수 있도록 구성되어 있습니다.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-lime-600 text-white rounded-full flex items-center justify-center font-medium">
                    3
                  </div>
                  <div className="flex-1 bg-lime-50 p-4 rounded-lg border border-lime-200">
                    <h4 className="font-bold mb-2 text-lime-900">
                      북마크로 뉴스 저장
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      중요한 뉴스는 북마크해서 모아두면 나중에 다시 찾아보기
                      편합니다. 이슈별로 정리해두고 싶을 때 유용합니다.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-medium">
                    4
                  </div>
                  <div className="flex-1 bg-white p-4 rounded-lg border border-green-200">
                    <h4 className="font-bold mb-2 text-green-900">
                      개인 페이지 활용
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      MyPage에서 프로필과 관심 키워드를 설정하면, 더 잘 맞는
                      콘텐츠를 중심으로 뉴스를 관리할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. FAQ */}
            <section className="mb-12">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  자주 묻는 질문 (FAQ)
                </h2>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <article
                    key={index}
                    className="bg-white border-2 border-green-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all"
                  >
                    <h3 className="font-bold text-gray-900 mb-3 flex items-start">
                      <span className="text-green-600 mr-2">Q.</span>
                      {faq.question}
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed pl-6">
                      <span className="text-emerald-600 font-bold">A.</span>{" "}
                      {faq.answer}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            {/* 5. 안전한 이용을 위한 가이드 */}
            <section className="mb-12 border-2 border-green-200 rounded-2xl shadow-md bg-white">
              <div className="bg-green-50 p-6 rounded-t-2xl">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <span>🛡️</span> 안전한 이용을 위한 가이드라인
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 bg-white p-4 rounded-lg border border-green-200">
                  <span className="text-green-600 mt-0.5">•</span>
                  <div>
                    <p className="font-medium text-green-900 mb-1">존중하는 토론</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      다른 사용자의 의견을 존중하며 건전한 토론 문화를
                      만들어주세요.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-green-50 p-4 rounded-lg border border-green-200">
                  <span className="text-emerald-600 mt-0.5">•</span>
                  <div>
                    <p className="font-medium text-emerald-900 mb-1">팩트 체크</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      정보를 공유할 때는 출처를 확인하고 검증된 내용을
                      게시해주세요.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-lime-50 p-4 rounded-lg border border-lime-200">
                  <span className="text-lime-600 mt-0.5">•</span>
                  <div>
                    <p className="font-medium text-lime-900 mb-1">개인정보 보호</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      개인정보나 타인의 사생활에 관한 내용은 게시하지 마세요.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. 문의 안내 */}
            <section className="mb-4 border-2 border-green-200 rounded-2xl shadow-md bg-white">
              <div className="bg-green-50 p-6 rounded-t-2xl">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <span>👥</span> 문의하기
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6 leading-relaxed">
                  서비스 이용 중 문제가 발생하거나 개선 제안이 있으시면 언제든지
                  연락해주세요. 문의 게시판을 통해 질문을 남기면, 운영진 또는
                  다른 이용자의 답변을 함께 확인할 수 있습니다.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-green-200">
                    <span className="text-green-600">•</span>
                    <p className="text-sm">
                      <strong>이메일:</strong> 여기에 대표 이메일 작성
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg border border-green-200">
                    <span className="text-emerald-600">•</span>
                    <p className="text-sm">
                      <strong>운영시간:</strong> 평일 09:00 - 18:00
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-lime-50 p-3 rounded-lg border border-lime-200">
                    <span className="text-lime-600">•</span>
                    <p className="text-sm">
                      <strong>게시판:</strong> 일반적인 질문은 About 게시판의
                      &apos;Inquiry&apos; 카테고리를 이용해주세요.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  };

  export default GuidePage;