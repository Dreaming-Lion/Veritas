// src/pages/InquiryPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

type InquiryItem = {
  id: number;
  user_id: number;
  title: string;
  content: string;
  status: "pending" | "answered" | "closed";
  is_public: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  excerpt?: string | null;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

const InquiryPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function createInquiry(payload: {
    title: string;
    content: string;
    is_public?: boolean;
  }): Promise<InquiryItem> {
    const token = localStorage.getItem("access_token");

    const res = await fetch(`${API_BASE}/inquiries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...payload, is_public: false }),
    });

    if (res.status === 401) {
      throw Object.assign(new Error("unauthorized"), { code: 401 });
    }

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const msg = j?.detail || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    return res.json();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSuccess(null);

    const t = title.trim();
    const c = content.trim();

    if (!t || !c) {
      setError("제목과 내용을 모두 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await createInquiry({ title: t, content: c });
      setSuccess("문의가 성공적으로 제출되었습니다. 감사합니다!");
      setTitle("");
      setContent("");
    } catch (err: any) {
      if (err?.code === 401) {
        setError("로그인 후 이용 가능한 서비스입니다.");
      } else {
        setError(err?.message ?? "문의 등록에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting;

  return (
    <div
      className="min-h-screen w-screen bg-gray-50 px-4 sm:px-6 lg:px-8 xl:px-14 2xl:px-30"
      style={{ width: "calc(100vw - 34px)" }}
    >
      <header className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md">
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <rect
                  x="4"
                  y="4"
                  width="16"
                  height="16"
                  rx="4"
                  strokeLinejoin="round"
                />
                <path
                  d="M7.5 10.5 12 13.5l4.5-3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M8 9h8" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <h1 className="text-3xl font-bold">문의하기</h1>
              <p className="text-sm text-white/90 mt-1">
                오류나 개선 사항을 문의 게시판에 등록해주세요. 스크린샷이나 관련
                이미지를 첨부하시면 더 빠른 확인이 가능합니다.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full flex justify-center px-4 py-8">
        <div className="w-full max-w-6xl">
          <section className="mt-6 mb-10">
            <div className="bg-white border border-green-200 rounded-2xl shadow-md px-6 sm:px-8 py-6">
              <div className="mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                  문의 작성
                </h2>
                <p className="text-sm text-gray-600">
                  서비스 이용 중 발견한 오류나 개선 사항을 자유롭게 작성해주세요.
                  스크린샷이나 관련 이미지를 첨부하시면 더 정확한 답변을 받을 수
                  있습니다.
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  <span className="text-red-500">*</span> 표시는 필수 입력 항목입니다.
                </p>
              </div>

              {(error || success) && (
                <div
                  role="status"
                  className={[
                    "mb-5 rounded-lg px-4 py-3 border text-sm",
                    error
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-green-200 bg-green-50 text-green-700",
                  ].join(" ")}
                >
                  {error || success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-800 mb-1"
                  >
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="문의 제목을 입력해주세요"
                    maxLength={200}
                    disabled={disabled}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                               disabled:opacity-60"
                  />
                  <div className="mt-1 text-xs text-gray-400 text-right">
                    {title.length}/200
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="content"
                    className="block text-sm font-medium text-gray-800 mb-1"
                  >
                    내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="문의 내용을 자세히 작성해주세요"
                    rows={8}
                    disabled={disabled}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                               resize-none disabled:opacity-60"
                  />
                  <div className="mt-1 text-xs text-gray-400 text-right">
                    {content.length}/2000
                  </div>
                </div>

                <div className="pt-1">
                  <p className="text-sm font-medium text-gray-800 mb-2">
                    파일 첨부 <span className="text-gray-400 text-xs">(선택)</span>
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div>
                      <label
                        htmlFor="file"
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-green-500 text-sm font-medium text-green-600 bg-white hover:bg-green-50 cursor-pointer"
                      >
                        파일 선택
                      </label>
                      <input id="file" type="file" className="hidden" />
                    </div>
                    <p className="text-xs text-gray-500">
                      이미지 파일 첨부 가능 (최대 10MB, 캡처 이미지 권장)
                    </p>
                  </div>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    disabled={disabled}
                    className="w-full sm:w-32 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 py-2.5
                               hover:bg-gray-50 disabled:opacity-60"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={disabled}
                    className="w-full sm:w-40 rounded-lg border border-green-500 bg-white text-sm font-semibold text-gray-800 py-2.5
                               hover:bg-green-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    문의 등록
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="mb-10">
            <div className="rounded-2xl border border-green-200 bg-green-50 px-6 py-4 text-sm text-gray-700 leading-relaxed">
              <p className="mb-1">
                • 문의는 보통 1–2 영업일 이내에 답변드립니다.
              </p>
              <p className="mb-1">
                • 등록된 문의는 「나의 문의 목록」에서 상태와 답변 내용을 함께
                확인하실 수 있습니다.
              </p>
              <p>
                • 개인정보(주민번호, 전화번호 등)는 문의 내용에 포함하지 않도록
                주의해주세용
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default InquiryPage;
