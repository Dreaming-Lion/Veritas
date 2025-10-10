import React from "react";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

type Tab = "login" | "signup";

interface Props {
  open: boolean;
  onClose: () => void;
  initialTab?: Tab;
}

const Icon = {
  mail: <Mail className="w-5 h-5 text-gray-600" />,
  lock: <Lock className="w-5 h-5 text-gray-600" />,
  user: <User className="w-5 h-5 text-gray-600" />,
  eye: <Eye className="w-5 h-5 text-gray-700" />,
  eyeOff: <EyeOff className="w-5 h-5 text-gray-700" />,
};


/* 상단 탭 바 */
const SegmentedTabs: React.FC<{ tab: Tab; setTab: (t: Tab) => void }> = ({ tab, setTab }) => (
  <div className="w-full rounded-full bg-gray-100/90 border border-gray-200 p-1.5 flex">
    <button
      type="button"
      aria-pressed={tab === "login"}
      onClick={() => setTab("login")}
      className={[
        "flex-1 rounded-full !px-5 !py-2 text-sm font-semibold transition hover:!border-0 !rounded-full",
        tab === "login"
          ? "!bg-white text-gray-900 shadow-sm border border-gray-200 !rounded-full"
          : "text-gray-500 hover:text-gray-700 !bg-transparent !rounded-full",
      ].join(" ")}
    >
      로그인
    </button>
    <button
      type="button"
      aria-pressed={tab === "signup"}
      onClick={() => setTab("signup")}
      className={[
        "!flex-1 rounded-full !px-5 !py-2 text-sm font-semibold transition hover:!border-0 !rounded-full",
        tab === "signup"
          ? "!bg-white text-gray-900 shadow-sm border border-gray-200 !rounded-full"
          : "text-gray-500 hover:text-gray-700 !bg-transparent !rounded-full",
      ].join(" ")}
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
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
        {leftIcon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-gray-100 border border-gray-200 pl-11 pr-12 py-3 outline-none
                   placeholder:text-gray-400 text-gray-800"
      />
      {rightIconBtn && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightIconBtn}</span>
      )}
    </div>
  </label>
);

const LoginSignupModal: React.FC<Props> = ({ open, onClose, initialTab = "login" }) => {
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
    setTab(initialTab);
  }, [initialTab]);

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
        className="relative w-full max-w-[460px] rounded-2xl bg-white shadow-xl border border-gray-200 p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 탭 바 */}
        <SegmentedTabs tab={tab} setTab={setTab} />

        {/* 폼 영역 */}
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
                className="relative w-8 h-8 rounded-full
                            !bg-white !border !border-gray-300 text-gray-700
                            hover:!border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                <span className="absolute inset-0 flex items-center justify-center">
                    {showLoginPw ? (
                    <EyeOff className="w-5 h-5 text-gray-700" />
                    ) : (
                    <Eye className="w-5 h-5 text-gray-700" />
                    )}
                </span>
                </button>
                }
                value={loginPw}
                onChange={setLoginPw}
              />

              <button
                type="button"
                className="mt-2 w-full rounded-xl !bg-green-500 hover:!bg-green-600 active:!bg-green-700
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
                className="relative w-8 h-8 rounded-full
                            !bg-white !border !border-gray-300 text-gray-700
                            hover:!border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                <span className="absolute inset-0 flex items-center justify-center">
                    {showPw2 ? Icon.eyeOff : Icon.eye}
                </span>
                </button>

                }
                value={pw2}
                onChange={setPw2}
              />

              <button
                type="button"
                className="mt-2 w-full rounded-xl !bg-green-500 hover:!bg-green-600 active:!bg-green-700
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

export default LoginSignupModal;
