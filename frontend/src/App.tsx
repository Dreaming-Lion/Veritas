import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import MainPage from "./pages/MainPage";
import ArticleDetailPage from "./pages/ArticleDetailPage";

const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/Detail" element={<ArticleDetailPage />} />
      </Routes>
    </Layout>
  );
};

export default App;
