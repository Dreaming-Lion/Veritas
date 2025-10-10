import React, { useState } from "react";
import { Mail } from "lucide-react";

const InquiryPage: React.FC = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }
    alert("문의가 성공적으로 제출되었습니다. 감사합니다!");
    setTitle("");
    setContent("");
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <main
        className="w-screen min-h-screen bg-gradient-to-b from-white to-green-50 pt-12"
        style={{ width: "calc(100vw - 32px)", paddingBottom: 0, margin: 0 }}
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
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                문의하기
              </h3>
              <p className="text-gray-600 mb-6">
                불편한 점이 있다면 문의를 남겨주세요!
              </p>
              <hr className="border-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
              <div>
                <label
                  htmlFor="title"
                  className="block text-base font-medium text-gray-700 mb-2"
                >
                  제목
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="문의 제목을 입력하세요"
                  className="
                    w-full border border-gray-300 rounded-lg px-4 py-2 
                    focus:outline-none focus:ring-2 focus:ring-green-400 
                    transition-all duration-200
                  "
                />
              </div>

              <div>
                <label
                  htmlFor="content"
                  className="block text-base font-medium text-gray-700 mb-2"
                >
                  내용
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="문의 내용을 작성해주세요"
                  rows={8}
                  className="
                    w-full border border-gray-300 rounded-lg px-4 py-1 
                    focus:outline-none focus:ring-2 focus:ring-green-400 
                    resize-none transition-all duration-200
                  "
                />
              </div>

              <button
                type="submit"
                className="
                  w-full !bg-green-600 text-white font-semibold rounded-lg py-3 
                  hover:!bg-green-700 hover:shadow-md 
                  transition-all duration-200
                "
              >
                문의하기
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InquiryPage;
