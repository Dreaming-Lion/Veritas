// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import MainPage from "./pages/MainPage";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import BookmarkPage from "./pages/BookmarkPage";
import InquiryPage from "./pages/InquiryPage";
import { AuthDialogProvider } from "./components/auth/AuthDialogProvider";
import GuidePage from "./pages/GuidePage";
import AboutPage from "./pages/AboutPage";
import MyPage from "./pages/MyPage";

const App: React.FC = () => {
  return (
    <AuthDialogProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/Detail" element={<ArticleDetailPage />} />
          <Route path="/bookmarks" element={<BookmarkPage />} />
          <Route path="/inquiry" element={<InquiryPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/mypage" element={<MyPage />} />
        </Routes>
      </Layout>
    </AuthDialogProvider>
  );
};

export default App;
