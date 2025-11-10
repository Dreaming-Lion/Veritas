// src/components/Header.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthDialog } from "../auth/AuthDialogProvider";

/** JWT payload 디코더 (base64url → JSON) */
function decodeJwt<T = any>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [mAboutOpen, setMAboutOpen] = useState(false);
  const hoverTimer = useRef<number | null>(null);
  const { pathname } = useLocation();

  const { open: openAuth } = useAuthDialog();

  const [authed, setAuthed] = useState<boolean>(!!localStorage.getItem("access_token"));
  const [nickname, setNickname] = useState<string | null>(null);

  const refreshAuthFromStorage = () => {
    const token = localStorage.getItem("access_token");
    setAuthed(!!token);
    if (token) {
      const payload = decodeJwt<{ nickname?: string }>(token);
      setNickname(payload?.nickname ?? null);
    } else {
      setNickname(null);
    }
  };

  useEffect(() => {
    refreshAuthFromStorage();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token") refreshAuthFromStorage();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    setAboutOpen(false);
    setMAboutOpen(false);
  }, [pathname]);

  // 경로 유틸
  const isStarts = (p: string) => pathname.startsWith(p);
  const isExact = (p: string) => pathname === p || pathname === `${p}/`;

  // 활성 상태
  const activeHome = isExact("/");
  const activeBookmarks = isStarts("/bookmarks");
  const activeGuide = isStarts("/guide");
  const activeAbout = isExact("/about");
  const activeInquiry = isExact("/inquiry");                 // 단건(작성/문의) 페이지
  const activeInquiryList = isStarts("/inquiry/list");       // 리스트 페이지

  const iconCls = "w-4 h-4 shrink-0";

  const navPill = (active: boolean) =>
    [
      "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition border",
      active
        ? "bg-green-500 !text-white visited:!text-white border-green-500"
        : "!text-gray-600 visited:!text-gray-600 border-transparent hover:text-green-600",
    ].join(" ");

  // 모바일 카드
  const mobileCard = (active: boolean) =>
    [
      "flex items-center gap-2 w-full rounded-lg px-4 py-3 font-medium border transition",
      active
        ? "bg-green-500 !text-white visited:!text-white border-green-500"
        : "bg-white !text-gray-600 [&:link]:!text-gray-600 [&:visited]:!text-gray-600 border-gray-200 hover:text-green-600",
    ].join(" ");

  // 드롭다운 열기/닫기 딜레이
  const openNow = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setAboutOpen(true);
  };
  const closeWithDelay = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setAboutOpen(false), 500);
  };

  // 로그아웃
  const onLogout = () => {
    localStorage.removeItem("access_token");
    refreshAuthFromStorage();
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
      <div className="w-full h-16 px-4 sm:px-6 lg:px-10 flex items-center">
        <div className="w-full flex items-center justify-between md:grid md:grid-cols-3 md:gap-4">
          {/* 로고 */}
          <Link to="/">
            <div className="flex items-center gap-2">
              <div className="bg-green-500 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold">V</div>
              <span className="text-xl font-extrabold text-green-600 tracking-tight">Veritas</span>
            </div>
          </Link>

          {/* 데스크탑 네비: lg부터 표시 */}
          <nav className="hidden lg:block relative">
            <ul className="flex justify-center items-center gap-4">
              <li>
                <Link to="/" className={navPill(activeHome)}>
                  <svg viewBox="0 0 24 24" className={iconCls} fill="none">
                    <path
                      d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                  HOME
                </Link>
              </li>

              <li>
                <Link to="/bookmarks" className={navPill(activeBookmarks)}>
                  <svg viewBox="0 0 24 24" className={iconCls} fill="none">
                    <path
                      d="M7 3h10a1 1 0 0 1 1 1v16l-6-3-6 3V4a1 1 0 0 1 1-1z"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                  Bookmarks
                </Link>
              </li>

              <li>
                <Link to="/guide" className={navPill(activeGuide)}>
                  <svg viewBox="0 0 24 24" className={iconCls} fill="none">
                    <path
                      d="M3 6.5A2.5 2.5 0 0 1 5.5 4H11v14H5.5A2.5 2.5 0 0 1 3 15.5v-9Z"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    />
                    <path
                      d="M21 6.5A2.5 2.5 0 0 0 18.5 4H13v14h5.5A2.5 2.5 0 0 0 21 15.5v-9Z"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                  Guide
                </Link>
              </li>

              {/* About + Inquiry + Inquiry List */}
              <li
                className="relative inline-block"
                onMouseEnter={openNow}
                onMouseLeave={closeWithDelay}
              >
                <Link to="/about" className={navPill(activeAbout)}>
                  <svg viewBox="0 0 24 24" className={iconCls} fill="none">
                    <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M7 19a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  About
                </Link>

                {aboutOpen && (
                  <div
                      className="absolute left-0 top-full mt-2 z-10
                                min-w-[100px] w-max
                                rounded-xl border border-gray-200 bg-white shadow-lg
                                overflow-hidden divide-y divide-gray-200"
                      onMouseEnter={openNow}
                      onMouseLeave={closeWithDelay}
                    >
                    {/* Inquiry (단건/작성) */}
                    <Link
                      to="/inquiry"
                      className={[
                        "flex items-center gap-2 px-3 py-2 text-sm font-semibold transition",
                        activeInquiry ? "bg-green-500 !text-white visited:!text-white" : "!text-gray-700 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <svg viewBox="0 0 24 24" className={iconCls} fill="none">
                        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M3.5 6l8.5 6 8.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Inquiry
                    </Link>

                    {/* Inquiry List */}
                    <Link
                      to="/inquiry/list"
                      className={[
                        "flex items-center gap-2 px-3 py-2 text-sm font-semibold transition",
                        activeInquiryList ? "bg-green-500 !text-white visited:!text-white" : "!text-gray-700 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <svg viewBox="0 0 24 24" className={iconCls} fill="none">
                        <path d="M5 6h14M5 12h14M5 18h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                      Inquiry List
                    </Link>
                  </div>
                )}
              </li>
            </ul>
          </nav>

          {/* 우측: 인증 영역 + 햄버거 */}
          <div className="flex items-center gap-3 md:justify-end justify-end md:col-start-3">
            <div className="hidden lg:flex items-center gap-3">
              {!authed ? (
                <>
                  <button
                    type="button"
                    onClick={() => openAuth("login")}
                    className="inline-flex items-center gap-2 !bg-white px-3 py-1.5 rounded
                               !text-gray-600 hover:text-green-600 transition hover:!border-0"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                      <path d="M5 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5"
                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 12h8M16 8l4 4-4 4"
                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    로그인
                  </button>

                  <button
                    type="button"
                    onClick={() => openAuth("signup")}
                    className="inline-flex items-center gap-2 rounded-full border !border-green-500 bg-white
                               !text-green-600 px-4 py-1.5 hover:!bg-green-50 transition hover:!border-green-500"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 20a8 8 0 1 1 16 0"
                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    회원가입
                  </button>
                </>
              ) : (
                <>
                  {/* 환영 배지 */}
                  <div className="px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-700 bg-white">
                    {nickname ? `${nickname}님 환영해요` : "로그인됨"}
                  </div>
                  {/* 로그아웃 */}
                  <button
                    type="button"
                    onClick={onLogout}
                      className="inline-flex items-center gap-2 rounded-full
                                  border !border-green-500 !bg-green-500 !text-white
                                  px-4 py-1.5 hover:bg-green-600 transition"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                      <path d="M5 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5"
                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 12h8M16 8l4 4-4 4"
                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    로그아웃
                  </button>
                </>
              )}
            </div>

            {/* 햄버거: 모바일+태블릿에서 표시 */}
            <button
              onClick={() => setOpen(v => !v)}
              className="lg:hidden p-2 rounded hover:bg-gray-100 text-gray-700 ml-2"
              aria-label="toggle menu"
            >
              {open ? (
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일/태블릿 드롭다운 */}
      <div className={`${open ? "block" : "hidden"} lg:hidden border-t bg-white`}>
        <ul className="px-4 py-3 space-y-2">
          <li>
            <Link to="/" onClick={() => setOpen(false)} className={mobileCard(activeHome)}>
              HOME
            </Link>
          </li>

          <li>
            <Link to="/bookmarks" onClick={() => setOpen(false)} className={mobileCard(activeBookmarks)}>
              Bookmarks
            </Link>
          </li>

          <li>
            <Link to="/guide" onClick={() => setOpen(false)} className={mobileCard(activeGuide)}>
              Guide
            </Link>
          </li>

          {/* About + Inquiry + Inquiry List (모바일/태블릿) */}
          <li className="space-y-2">
            <div className="relative">
              <Link to="/about" onClick={() => setOpen(false)} className={mobileCard(activeAbout)}>
                About
              </Link>
              <button
                onClick={() => setMAboutOpen(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                aria-label="toggle about submenu"
                aria-expanded={mAboutOpen}
              >
                <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-transform ${mAboutOpen ? "rotate-180" : ""}`}>
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {mAboutOpen && (
              <>
                <Link to="/inquiry" onClick={() => setOpen(false)} className={`ml-6 ${mobileCard(activeInquiry)}`}>
                  Inquiry
                </Link>
                <Link to="/inquiry/list" onClick={() => setOpen(false)} className={`ml-6 ${mobileCard(activeInquiryList)}`}>
                  Inquiry List
                </Link>
              </>
            )}
          </li>

          {/* 모바일 인증 영역 */}
          <li className="pt-2 flex gap-3">
            {!authed ? (
              <>
                <button
                  type="button"
                  onClick={() => { openAuth("login"); setOpen(false); }}
                  className="flex-1 inline-flex justify-center items-center gap-2 bg-white px-3 py-2 rounded
                             !text-gray-600 hover:text-green-600 transition"
                >
                  로그인
                </button>

                <button
                  type="button"
                  onClick={() => { openAuth("signup"); setOpen(false); }}
                  className="flex-1 inline-flex justify-center items-center gap-2 rounded-full border border-green-500 bg-white
                             !text-green-600 px-3 py-2 hover:bg-green-50 transition"
                >
                  회원가입
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 inline-flex justify-center items-center gap-2 bg-white px-3 py-2 rounded border border-gray-200 text-gray-700">
                  {nickname ? `${nickname}님 환영해요` : "로그인됨"}
                </div>
                <button
                  type="button"
                  onClick={() => { onLogout(); setOpen(false); }}
                  className="flex-1 inline-flex justify-center items-center gap-2 rounded-full
                            border border-green-500 !bg-green-500 !text-white
                            px-3 py-2 hover:bg-green-600 transition"
                >
                  로그아웃
                </button>
              </>
            )}
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Header;
