// src/pages/InquiryPage.tsx
import React, { useState } from "react";
import { Mail } from "lucide-react";

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

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function createInquiry(payload: {
    title: string;
    content: string;
    is_public?: boolean; // UI는 비공개 기본
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
      // FastAPI 에러 표준(detail)
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

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <main
        className="w-screen min-h-screen px-4 sm:px-6 lg:px-8 xl:px-14 2xl:px-30 bg-gradient-to-b from-white to-green-50 pt-12"
        style={{ paddingBottom: 0, margin: 0, width: "calc(100vw - 28px)" }}
      >
        <div className="mx-4 sm:mx-8 md:mx-12 lg:mx-16 xl:mx-24 2xl:mx-36 flex justify-center mb-0">
          <div
            className="
              bg-white border border-gray-200 rounded-2xl shadow-lg
              p-6 sm:p-8 lg:p-6
              w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl
              transition-all duration-300 hover:shadow-xl
            "
          >
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 text-green-600 rounded-full p-4 flex items-center justify-center shadow-sm">
                  <Mail className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">문의하기</h3>
              <p className="text-gray-600 mb-6">불편한 점이 있다면 문의를 남겨주세요!</p>
              <hr className="border-gray-200" />
            </div>

            {/* 상태 메시지 */}
            {(error || success) && (
              <div
                role="status"
                className={[
                  "mb-6 rounded-lg px-4 py-3 border",
                  error
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-green-200 bg-green-50 text-green-700",
                ].join(" ")}
              >
                {error || success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
              <div>
                <label htmlFor="title" className="block text-base font-medium text-gray-700 mb-2">
                  제목
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="문의 제목을 입력하세요"
                  maxLength={200}
                  disabled={submitting}
                  className="
                    w-full border border-gray-300 rounded-lg px-4 py-2 
                    focus:outline-none focus:ring-2 focus:ring-green-400 
                    transition-all duration-200 disabled:opacity-60
                  "
                />
                <div className="mt-1 text-xs text-gray-400">{title.length}/200</div>
              </div>

              <div>
                <label htmlFor="content" className="block text-base font-medium text-gray-700 mb-2">
                  내용
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="문의 내용을 작성해주세요"
                  rows={8}
                  disabled={submitting}
                  className="
                    w-full border border-gray-300 rounded-lg px-4 py-2 
                    focus:outline-none focus:ring-2 focus:ring-green-400 
                    resize-none transition-all duration-200 disabled:opacity-60
                  "
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="
                  w-full !bg-green-600 text-white font-semibold rounded-lg py-3 
                  hover:!bg-green-700 hover:shadow-md 
                  transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
                "
              >
                {submitting ? "제출 중…" : "문의하기"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InquiryPage;