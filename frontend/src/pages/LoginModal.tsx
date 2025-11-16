// src/components/LoginSignupModal.tsx
import React from "react";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { login, signup } from "../services/auth";

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

const SegmentedTabs: React.FC<{ tab: Tab; setTab: (t: Tab) => void }> = ({
  tab,
  setTab,
}) => (
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
  error?: string;
}> = ({
  label,
  type = "text",
  placeholder,
  leftIcon,
  rightIconBtn,
  value,
  onChange,
  error,
}) => (
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
        className={[
          "w-full rounded-xl bg-gray-100 border pl-11 pr-12 py-3 outline-none placeholder:text-gray-400 text-gray-800",
          error ? "border-red-400" : "border-gray-200",
        ].join(" ")}
      />
      {rightIconBtn && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightIconBtn}
        </span>
      )}
    </div>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </label>
);

const LoginSignupModal: React.FC<Props> = ({
  open,
  onClose,
  initialTab = "login",
}) => {
  const [tab, setTab] = React.useState<Tab>(initialTab);

  // 로그인
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPw, setLoginPw] = React.useState("");
  const [showLoginPw, setShowLoginPw] = React.useState(false);

  // 회원가입
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [showPw2, setShowPw2] = React.useState(false);

  // 상태
  const [loading, setLoading] = React.useState(false);
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  );

  React.useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // 간단한 유효성
  const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v);

  const validateLogin = () => {
    const errors: Record<string, string> = {};
    if (!isEmail(loginEmail)) errors.loginEmail = "올바른 이메일 형식이 아닙니다.";
    if (!loginPw) errors.loginPw = "비밀번호를 입력하세요.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSignup = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "이름(닉네임)을 입력하세요.";
    if (!isEmail(email)) errors.email = "올바른 이메일 형식이 아닙니다.";
    if (pw.length < 6) errors.pw = "비밀번호는 6자 이상이어야 합니다.";
    if (pw2.length < 6) errors.pw2 = "비밀번호 확인은 6자 이상이어야 합니다.";
    if (pw && pw2 && pw !== pw2) errors.pw2 = "비밀번호가 일치하지 않습니다.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onClickLogin = async () => {
    setGlobalError(null);
    if (!validateLogin()) return;
    setLoading(true);
    try {
      const data = await login({ email: loginEmail, password: loginPw });
      localStorage.setItem("access_token", data.access_token);
      window.location.reload();
    } catch (e: any) {
      setGlobalError(e?.message ?? "로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  const onClickSignup = async () => {
    setGlobalError(null);
    if (!validateSignup()) return;
    setLoading(true);
    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        password: pw,
        passwordConfirm: pw2, 
      });
      setTab("login");
    } catch (e: any) {
      setGlobalError(e?.message ?? "회원가입 실패");
    } finally {
      setLoading(false);
    }
  };

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
        <SegmentedTabs tab={tab} setTab={setTab} />

        <div className="mt-5 space-y-4">
          {globalError && (
            <div className="rounded-md border border-red-200 bg-red-50 text-red-700 text-sm p-3">
              {globalError}
            </div>
          )}

          {tab === "login" ? (
            <>
              <Field
                label="이메일"
                placeholder="이메일을 입력하세요"
                leftIcon={Icon.mail}
                value={loginEmail}
                onChange={setLoginEmail}
                error={fieldErrors.loginEmail}
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
                error={fieldErrors.loginPw}
              />

              <button
                type="button"
                disabled={loading}
                onClick={onClickLogin}
                className="mt-2 w-full rounded-xl !bg-green-500 hover:!bg-green-600 active:!bg-green-700
                           text-white py-3 font-semibold transition disabled:opacity-60"
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </>
          ) : (
            <>
              <Field
                label="이름"
                placeholder="이름을 입력하세요"
                leftIcon={Icon.user}
                value={name}
                onChange={(v) => {
                  setName(v);
                  if (fieldErrors.name)
                    setFieldErrors((e) => ({ ...e, name: "" }));
                }}
                error={fieldErrors.name}
              />
              <Field
                label="이메일"
                placeholder="이메일을 입력하세요"
                leftIcon={Icon.mail}
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  if (fieldErrors.email)
                    setFieldErrors((e) => ({ ...e, email: "" }));
                }}
                error={fieldErrors.email}
              />
              <Field
                label="비밀번호"
                placeholder="비밀번호를 입력하세요 (6자 이상)"
                type="password"
                leftIcon={Icon.lock}
                value={pw}
                onChange={(v) => {
                  setPw(v);
                  if (fieldErrors.pw)
                    setFieldErrors((e) => ({ ...e, pw: "" }));
                }}
                error={fieldErrors.pw}
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
                onChange={(v) => {
                  setPw2(v);
                  if (fieldErrors.pw2)
                    setFieldErrors((e) => ({ ...e, pw2: "" }));
                }}
                error={fieldErrors.pw2}
              />

              <button
                type="button"
                disabled={loading}
                onClick={onClickSignup}
                className="mt-2 w-full rounded-xl !bg-green-500 hover:!bg-green-600 active:!bg-green-700
                           text-white py-3 font-semibold transition disabled:opacity-60"
              >
                {loading ? "회원가입 중..." : "회원가입"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginSignupModal;
