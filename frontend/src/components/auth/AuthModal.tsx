import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useAuthModal } from "./useAuthModal";

const Icon = {
  mail: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" aria-hidden>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

function Field({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  right,
}: {
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-gray-100 border border-gray-200 pl-10 pr-10 py-3 outline-none
                   focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white"
      />
      {right ? (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {right}
        </button>
      ) : null}
    </div>
  );
}

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 실제 로그인 로직
    console.log({ email, pw });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field icon={Icon.mail} placeholder="이메일을 입력하세요" value={email} onChange={setEmail} />
      <Field
        icon={Icon.lock}
        placeholder="비밀번호를 입력하세요"
        value={pw}
        onChange={setPw}
        type={show ? "text" : "password"}
        right={<span onClick={() => setShow((s) => !s)}>{Icon.eye}</span>}
      />
      <button
        type="submit"
        className="w-full rounded-xl bg-green-600 text-white py-3 font-medium hover:bg-green-700 active:translate-y-px"
      >
        로그인
      </button>
    </form>
  );
};

const SignupForm: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 실제 회원가입 로직
    console.log({ name, email, pw, pw2 });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field icon={Icon.user} placeholder="이름을 입력하세요" value={name} onChange={setName} />
      <Field icon={Icon.mail} placeholder="이메일을 입력하세요" value={email} onChange={setEmail} />
      <Field
        icon={Icon.lock}
        placeholder="비밀번호를 입력하세요 (6자 이상)"
        value={pw}
        onChange={setPw}
        type={show1 ? "text" : "password"}
        right={<span onClick={() => setShow1((s) => !s)}>{Icon.eye}</span>}
      />
      <Field
        icon={Icon.lock}
        placeholder="비밀번호를 다시 입력하세요"
        value={pw2}
        onChange={setPw2}
        type={show2 ? "text" : "password"}
        right={<span onClick={() => setShow2((s) => !s)}>{Icon.eye}</span>}
      />
      <button
        type="submit"
        className="w-full rounded-xl bg-green-600 text-white py-3 font-medium hover:bg-green-700 active:translate-y-px"
      >
        회원가입
      </button>
    </form>
  );
};

const AuthModal: React.FC = () => {
  const { isOpen, close, mode, setMode } = useAuthModal();

  // ESC로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px]" onClick={close} />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 w-[min(92vw,460px)] -translate-x-1/2 -translate-y-1/2
                   rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex w-full rounded-full bg-gray-100 p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition
                ${mode === "login" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
            >
              로그인
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition
                ${mode === "signup" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
            >
              회원가입
            </button>
          </div>
          <button onClick={close} className="ml-3 text-gray-400 hover:text-gray-600">{Icon.x}</button>
        </div>

        {mode === "login" ? <LoginForm /> : <SignupForm />}
      </div>
    </>,
    document.body
  );
};

export default AuthModal;
