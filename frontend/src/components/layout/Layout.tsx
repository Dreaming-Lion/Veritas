import React from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isInquiryPage = location.pathname === "/inquiry";

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        currentPage={""}
        onPageChange={() => {}}
        user={null}
        onAuthClick={() => {}}
        onLogout={() => {}}
      />

      {/* ✅ inquiry 페이지에서는 padding 제거 */}
      <main className={`w-full flex-1 ${isInquiryPage ? "" : "px-4 py-8"}`}>
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
