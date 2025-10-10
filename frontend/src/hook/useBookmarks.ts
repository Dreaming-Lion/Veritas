// src/hooks/useBookmarks.ts
import { useEffect, useMemo, useState } from "react";

export type Article = {
  id: number;
  title: string;
  excerpt: string;
  time: string;
  press: string;
};

const STORAGE_KEY = "bookmarks";
const EMPTY_KEY = "bookmark_empty"; // ✅ 빈 상태 저장 키 추가

export default function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Article[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Article[]) : [];
    } catch {
      return [];
    }
  });

  const [emptyState, setEmptyState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(EMPTY_KEY) === "true";
  });

  // ✅ 북마크 변경 시 로컬스토리지 동기화 + empty 상태 관리
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));

      if (bookmarks.length === 0) {
        localStorage.setItem(EMPTY_KEY, "true");
        setEmptyState(true);
      } else {
        localStorage.removeItem(EMPTY_KEY);
        setEmptyState(false);
      }
    } catch {
      /* ignore */
    }
  }, [bookmarks]);

  const ids = useMemo(() => new Set(bookmarks.map((b) => b.id)), [bookmarks]);
  const isSaved = (id: number) => ids.has(id);

  const add = (a: Article) =>
    setBookmarks((prev) => (prev.some((p) => p.id === a.id) ? prev : [a, ...prev]));

  const remove = (id: number) =>
    setBookmarks((prev) => prev.filter((p) => p.id !== id));

  const toggle = (a: Article) => (isSaved(a.id) ? remove(a.id) : add(a));

  const clear = () => setBookmarks([]);

  return { bookmarks, add, remove, toggle, isSaved, clear, emptyState };
}
