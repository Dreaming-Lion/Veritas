// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import MainPage from "./pages/MainPage";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import BookmarkPage from "./pages/BookmarkPage";
import { AuthDialogProvider } from "./components/auth/AuthDialogProvider";

const App: React.FC = () => {
  return (
    <AuthDialogProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/Detail" element={<ArticleDetailPage />} />
          <Route path="/bookmarks" element={<BookmarkPage />} />
        </Routes>
      </Layout>
    </AuthDialogProvider>
  );
};

export default App;
