import React from "react";
import Header from "./Header";
import Footer from "./Footer";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <Header currentPage={""} onPageChange={function (page: string): void {
              throw new Error("Function not implemented.");
          } } user={null} onAuthClick={function (type: "login" | "signup"): void {
              throw new Error("Function not implemented.");
          } } onLogout={function (): void {
              throw new Error("Function not implemented.");
          } } />
      <main className="flex-1 w-full bg-gray-50 px-4 sm:px-6 lg:px-10 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
