import React from "react";

type Tab = "login" | "signup";

interface Props {
  open: boolean;
  onClose: () => void;
  initialTab?: Tab;
}

const Icon = {
  x: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8"/>
      <path d="m22 8-10 6L2 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <rect x="4" y="11" width="16" height="9" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  eyeOff: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M10.6 10.6a3 3 0 0 0 4.24 4.24M9.88 4.13A10.9 10.9 0 0 1 12 4c6.5 0 10 6 10 6a17.6 17.6 0 0 1-3.13 3.68M6.3 6.3A17.8 17.8 0 0 0 2 10s3.5 6 10 6c1.1 0 2.15-.15 3.14-.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

const SegmentedTabs: React.FC<{ tab: Tab; setTab: (t: Tab) => void }> = ({ tab, setTab }) => (
  <div className="w-full rounded-full bg-gray-100 border border-gray-200 p-1 flex">
    <button
      type="button"
      onClick={() => setTab("login")}
      className={`flex-1 rounded-full px-5 py-2 font-medium transition
        ${tab === "login" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
    >
      로그인
    </button>
    <button
      type="button"
      onClick={() => setTab("signup")}
      className={`flex-1 rounded-full px-5 py-2 font-medium transition
        ${tab === "signup" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
    >
      회원가입
    </button>
  </div>
);

const Field: React.FC<{
  label: string;
  type?: string;
  placeholder?: string;
  leftIcon?: React.ReactNode;
  rightIconBtn?: React.ReactNode;
  value?: string;
  onChange?: (v: string) => void;
}> = ({ label, type = "text", placeholder, leftIcon, rightIconBtn, value, onChange }) => (
  <label className="block">
    <div className="mb-1 text-sm text-gray-700">{label}</div>
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {leftIcon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-gray-100 border border-gray-200 px-11 py-3 outline-none
                   focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white
                   placeholder:text-gray-400 text-gray-800"
      />
      {rightIconBtn && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightIconBtn}</span>
      )}
    </div>
  </label>
);

const useAuthModal: React.FC<Props> = ({ open, onClose, initialTab = "login" }) => {
  const [tab, setTab] = React.useState<Tab>(initialTab);

  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPw, setLoginPw] = React.useState("");
  const [showLoginPw, setShowLoginPw] = React.useState(false);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [showPw2, setShowPw2] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[1px] flex items-center justify-center px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[460px] rounded-2xl bg-white shadow-xl border border-gray-200 p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 text-gray-500"
          aria-label="닫기"
          title="닫기"
        >
          {Icon.x}
        </button>

        {/* Tabs */}
        <SegmentedTabs tab={tab} setTab={setTab} />

        {/* Forms */}
        <div className="mt-5 space-y-4">
          {tab === "login" ? (
            <>
              <Field
                label="이메일"
                placeholder="이메일을 입력하세요"
                leftIcon={Icon.mail}
                value={loginEmail}
                onChange={setLoginEmail}
              />
              <Field
                label="비밀번호"
                placeholder="비밀번호를 입력하세요"
                type={showLoginPw ? "text" : "password"}
                leftIcon={Icon.lock}
                rightIconBtn={
                  <button
                    type="button"
                    onClick={() => setShowLoginPw((s) => !s)}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                    aria-label={showLoginPw ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showLoginPw ? Icon.eyeOff : Icon.eye}
                  </button>
                }
                value={loginPw}
                onChange={setLoginPw}
              />

              <button
                type="button"
                className="mt-2 w-full rounded-xl bg-green-500 hover:bg-green-600 active:bg-green-700
                           text-white py-3 font-semibold transition"
              >
                로그인
              </button>
            </>
          ) : (
            <>
              <Field
                label="이름"
                placeholder="이름을 입력하세요"
                leftIcon={Icon.user}
                value={name}
                onChange={setName}
              />
              <Field
                label="이메일"
                placeholder="이메일을 입력하세요"
                leftIcon={Icon.mail}
                value={email}
                onChange={setEmail}
              />
              <Field
                label="비밀번호"
                placeholder="비밀번호를 입력하세요 (6자 이상)"
                type="password"
                leftIcon={Icon.lock}
                value={pw}
                onChange={setPw}
              />
              <Field
                label="비밀번호 확인"
                placeholder="비밀번호를 다시 입력하세요"
                type={showPw2 ? "text" : "password"}
                leftIcon={Icon.lock}
                rightIconBtn={
                  <button
                    type="button"
                    onClick={() => setShowPw2((s) => !s)}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                    aria-label={showPw2 ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPw2 ? Icon.eyeOff : Icon.eye}
                  </button>
                }
                value={pw2}
                onChange={setPw2}
              />

              <button
                type="button"
                className="mt-2 w-full rounded-xl bg-green-500 hover:bg-green-600 active:bg-green-700
                           text-white py-3 font-semibold transition"
              >
                회원가입
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default useAuthModal;
