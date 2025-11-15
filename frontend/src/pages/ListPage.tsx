// src/pages/MyPage.tsx
import React from "react";

/* ---------- API & 타입 ---------- */
const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

type Status = "pending" | "answered" | "closed";

type InquiryBrief = {
  id: number;
  title: string;
  status: Status;
  created_at?: string | null;
  updated_at?: string | null;
  excerpt?: string | null;
};

type InquiryItem = {
  id: number;
  user_id: number;
  title: string;
  content: string;
  status: Status;
  is_public: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

type ListResponse = { count: number; items: InquiryBrief[] };

function getToken() {
  return localStorage.getItem("access_token");
}

async function authedFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(input, { ...init, headers });
  return res;
}

/* ---------- 유틸: 상대시간 ---------- */
const formatRelativeKorean = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";

  const now = Date.now();
  let diffMs = now - d.getTime();
  if (diffMs < 0) diffMs = 0;

  const m = 60 * 1000;
  const h = 60 * m;
  const day = 24 * h;
  const week = 7 * day;

  if (diffMs < 30 * 1000) return "방금 전";
  if (diffMs < m) return `${Math.floor(diffMs / 1000)}초 전`;
  if (diffMs < h) return `${Math.floor(diffMs / m)}분 전`;
  if (diffMs < day) return `${Math.floor(diffMs / h)}시간 전`;
  if (diffMs < week) return `${Math.floor(diffMs / day)}일 전`;
  if (diffMs < 30 * day) return `${Math.floor(diffMs / week)}주 전`;

  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
  return `${yy}.${mm}.${dd} ${hhmm}`;
};

const useNowTick = (intervalMs = 60_000) => {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
};

/* ---------- 상태 배지 ---------- */
const StatusBadge: React.FC<{ s: Status }> = ({ s }) => {
  const map: Record<Status, { text: string; cls: string }> = {
    pending: {
      text: "대기",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
    answered: {
      text: "답변완료",
      cls: "bg-green-50 text-green-700 border-green-200",
    },
    closed: {
      text: "종결",
      cls: "bg-gray-50 text-gray-600 border-gray-200",
    },
  };
  const { text, cls } = map[s] || map.pending;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${cls}`}
    >
      {text}
    </span>
  );
};

/* ---------- 모달 ---------- */
const Modal: React.FC<
  React.PropsWithChildren<{ open: boolean; onClose: () => void; title?: string }>
> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-[94vw] max-w-3xl rounded-2xl shadow-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">
            {title || "상세 보기"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-100"
            aria-label="close"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path
                d="M6 18L18 6M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

/* ---------- 페이지 ---------- */
const PAGE_SIZE = 10;

const ListPage: React.FC = () => {
  const [items, setItems] = React.useState<InquiryBrief[]>([]);
  const [count, setCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // 상세/수정 모달 상태
  const [current, setCurrent] = React.useState<InquiryItem | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState("");
  const [editContent, setEditContent] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  useNowTick();

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  async function loadPage(p: number) {
    setLoading(true);
    setErr(null);
    try {
      const token = getToken();
      if (!token) {
        setItems([]);
        setCount(0);
        return;
      }

      const res = await authedFetch(
        `${API_BASE}/inquiries?mine=true&brief=true&limit=${PAGE_SIZE}&offset=${
          (p - 1) * PAGE_SIZE
        }`
      );

      if (res.status === 401) {
        setItems([]);
        setCount(0);
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j: ListResponse = await res.json();
      setItems(j.items || []);
      setCount(j.count || 0);
    } catch (e: any) {
    console.error(e); // 개발용 로그
    setErr("일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    setItems([]);
    setCount(0);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token") {
        setPage(1);
        loadPage(1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function openDetail(id: number) {
    try {
      const res = await authedFetch(`${API_BASE}/inquiries/${id}`);
      if (res.status === 401) {
        throw new Error("로그인이 필요합니다.");
      }
      if (res.status === 403) {
        throw new Error("본인이 작성한 문의만 조회할 수 있습니다.");
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j: InquiryItem = await res.json();
      setCurrent(j);
      setEditMode(false);
      setEditTitle(j.title);
      setEditContent(j.content);
      setModalOpen(true);
    } catch (e: any) {
      alert(e?.message ?? "조회 실패");
    }
  }

  async function saveEdit() {
    if (!current) return;
    const title = editTitle.trim();
    const content = editContent.trim();
    if (!title || !content) {
      alert("제목과 내용을 모두 입력하세요.");
      return;
    }
    setSaving(true);
    try {
      const res = await authedFetch(`${API_BASE}/inquiries/${current.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title, content }),
      });
      if (res.status === 401) {
        throw new Error("로그인이 필요합니다.");
      }
      if (res.status === 403) {
        throw new Error("본인이 작성한 문의만 수정할 수 있습니다.");
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j: InquiryItem = await res.json();
      setCurrent(j);
      setEditMode(false);
      setItems((prev) =>
        prev.map((it) =>
          it.id === j.id
            ? {
                ...it,
                title: j.title,
                excerpt:
                  (j.content || "").slice(0, 80) +
                  ((j.content || "").length > 80 ? "…" : ""),
                updated_at: j.updated_at,
              }
            : it
        )
      );
      alert("수정되었습니다.");
    } catch (e: any) {
      alert(e?.message ?? "수정 실패");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id: number) {
    if (!confirm("정말 삭제할까요? 삭제 후 되돌릴 수 없습니다.")) return;
    try {
      const res = await authedFetch(`${API_BASE}/inquiries/${id}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        throw new Error("로그인이 필요합니다.");
      }
      if (res.status === 403) {
        throw new Error("본인이 작성한 문의만 삭제할 수 있습니다.");
      }
      if (res.status !== 204) throw new Error(`HTTP ${res.status}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
      setCount((c) => Math.max(0, c - 1));
      alert("삭제되었습니다.");
      if (current?.id === id) setModalOpen(false);
    } catch (e: any) {
      alert(e?.message ?? "삭제 실패");
    }
  }

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <main
        className="w-screen min-h-screen px-4 sm:px-6 lg:px-8 xl:px-14 2xl:px-30"
        style={{ paddingBottom: 0, margin: 0, width: "calc(100vw - 60px)" }}
      >
        <div className="mx-auto w-full max-w-5xl">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-green-600"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="14"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M3.5 6l8.5 6 8.5-6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h2 className="font-semibold text-gray-800">내 문의 목록</h2>
            </div>
            <div className="text-sm text-gray-500">
              총{" "}
              <span className="font-medium text-gray-700">
                {count}
              </span>
              건
            </div>
          </div>

          <hr className="mb-6 border-gray-200" />

          {/* 목록 / 로딩 / 빈 상태 */}
          {loading ? (
            <ul className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="rounded-xl border border-gray-200 p-4">
                  <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse mb-2" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                </li>
              ))}
            </ul>
          ) : err ? (
            <div className="text-sm text-red-500">{err}</div>
          ) : items.length === 0 ? (
            <div className="w-full">
              <div className="mx-auto max-w-xl text-center bg-white border border-gray-200 rounded-2xl p-10 shadow-sm">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-6 h-6 text-green-600"
                    fill="none"
                  >
                    <path
                      d="M7 3h10a1 1 0 0 1 1 1v15.5l-6-3-6 3V4a1 1 0 0 1 1-1z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  아직 작성한 문의가 없습니다.
                </h3>
                <p className="text-sm text-gray-500">
                  로그인 후 문의를 작성해보세요.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <div className="max-h-[60vh] overflow-y-auto">
                <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 border-b border-gray-200 sticky top-0 z-10">
                  <div className="col-span-7">제목</div>
                  <div className="col-span-2">상태</div>
                  <div className="col-span-3 text-right pr-1">
                    작성/업데이트
                  </div>
                </div>

                <ul className="divide-y divide-gray-100">
                  {items.map((it) => (
                    <li key={it.id} className="px-5 py-4 transition group">
                      <div className="grid grid-cols-12 gap-3 items-start">
                        {/* 제목 + 발췌 */}
                        <div className="col-span-12 md:col-span-7">
                          <p
                            onClick={() => openDetail(it.id)}
                            onKeyDown={(e) =>
                              (e.key === "Enter" || e.key === " ") &&
                              openDetail(it.id)
                            }
                            tabIndex={0}
                            role="button"
                            className="font-medium text-gray-900 hover:text-green-700 cursor-pointer leading-snug line-clamp-2"
                            title={it.title}
                          >
                            {it.title}
                          </p>
                          {it.excerpt && (
                            <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                              {it.excerpt}
                            </p>
                          )}
                        </div>

                        {/* 상태 배지 */}
                        <div className="col-span-6 md:col-span-2 mt-2 md:mt-0">
                          <StatusBadge s={it.status} />
                        </div>

                        {/* 작성/수정 메타 */}
                        <div className="col-span-6 md:col-span-3 text-right text-xs text-gray-500 space-y-1">
                          <div className="inline-flex items-center gap-1">
                            <svg
                              viewBox="0 0 24 24"
                              className="w-3.5 h-3.5"
                              fill="none"
                            >
                              <path
                                d="M12 8v5l3 2"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                              <circle
                                cx="12"
                                cy="12"
                                r="9"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                            </svg>
                            <span>
                              작성 : {formatRelativeKorean(it.created_at)}
                            </span>
                          </div>
                          {it.updated_at && (
                            <div className="inline-flex items-center gap-1">
                              <svg
                                viewBox="0 0 24 24"
                                className="w-3.5 h-3.5"
                                fill="none"
                              >
                                <path
                                  d="M4 13a8 8 0 1 0 0-2h6"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span>
                                수정 : {formatRelativeKorean(it.updated_at)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 페이징 */}
          {count > PAGE_SIZE && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={goPrev}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white disabled:opacity-50"
              >
                이전
              </button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={goNext}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white disabled:opacity-50"
              >
                다음
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 상세/수정 모달 (여기서만 수정/삭제 가능) */}
      <Modal
        open={modalOpen && !!current}
        onClose={() => setModalOpen(false)}
        title="문의 상세"
      >
        {!current ? null : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <StatusBadge s={current.status} />
              <div className="text-xs text-gray-500">
                작성 {formatRelativeKorean(current.created_at)}
                {current.updated_at && (
                  <>
                    {" "}
                    · 수정 {formatRelativeKorean(current.updated_at)}
                  </>
                )}
              </div>
            </div>

            {!editMode ? (
              <>
                <div>
                  <div className="text-xs text-gray-500 mb-1">제목</div>
                  <div className="font-semibold text-gray-900">
                    {current.title}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">내용</div>
                  <p className="whitespace-pre-wrap leading-7 text-gray-800">
                    {current.content}
                  </p>
                </div>

                <div className="flex justify-end items-center gap-2 pt-2">
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 rounded-lg border border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => current && removeItem(current.id)}
                    className="px-4 py-2 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                  >
                    삭제
                  </button>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                  >
                    닫기
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    제목
                  </label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    maxLength={200}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {editTitle.length}/200
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    내용
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={8}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>

                <div className="flex justify-end items-center gap-2 pt-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 !rounded-lg !border !border-gray-200 !text-gray-700 !bg-white !hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="px-4 py-2 !rounded-lg !border !border-green-200 !text-white !bg-green-600 !hover:bg-green-700 !disabled:opacity-60"
                  >
                    {saving ? "저장 중…" : "저장"}
                  </button>
                  <button
                    onClick={() => current && removeItem(current.id)}
                    className="px-4 py-2 rounded-lg !border !border-red-200 !text-red-700 !bg-red-50 !hover:bg-red-100"
                  >
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ListPage;
