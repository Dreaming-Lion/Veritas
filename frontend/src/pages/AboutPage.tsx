import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {UserProfile} from "../components/mypage/UserProfile";
import {ActivitySummary} from "../components/mypage/ActivitySummary";
import {RecentArticles} from "../components/mypage/RecentArticles";
import {LikedArticles} from "../components/mypage/LikedArticles";
import {ReadingStats} from "../components/mypage/ReadingStats";
import {Settings} from "../components/mypage/Settings";

const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  const likedSectionRef = useRef<HTMLDivElement | null>(null);

  const handleGoBookmark = () => {
    navigate("/bookmarks");
  };

  const handleScrollToLiked = () => {
    likedSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div
      className={
        darkMode
          ? "min-h-screen bg-gray-900 text-white"
          : "min-h-screen bg-gradient-to-b from-emerald-50 to-white"
      }
    >
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* 1. 프로필 */}
        <section className="mb-8">
          <UserProfile darkMode={darkMode} />
        </section>

        {/* 2. 활동 요약 + 읽기 통계 */}
        <section className="grid gap-6 md:grid-cols-[2fr,3fr] mb-8">
          <ActivitySummary
            darkMode={darkMode}
            onPageChange={handleGoBookmark}
            onScrollToLiked={handleScrollToLiked}
          />
          <ReadingStats darkMode={darkMode} />
        </section>

        {/* 3. 최근 본 기사 + 좋아요한 기사 */}
        <section className="grid gap-6 md:grid-cols-[3fr,2fr] mb-8">
          <RecentArticles darkMode={darkMode} />
          <div ref={likedSectionRef}>
            <LikedArticles darkMode={darkMode} />
          </div>
        </section>

        {/* 4. 설정 */}
        <section className="mb-8">
          <Settings darkMode={darkMode} onDarkModeChange={setDarkMode} />
        </section>

      </main>
    </div>
  );
};

export default AboutPage;
