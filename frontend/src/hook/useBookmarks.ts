import * as React from "react";

export type Article = {
  id: number;
  title: string;
  excerpt: string;
  time: string;
  press: string;
  link?: string;
  content?: string | null;
};

type ApiArticle = {
  id: number;
  title: string;
  content?: string | null;
  summary?: string | null;
  date?: string | null;
  link?: string | null;
};

type BackendListResponse = {
  count: number;
  articles: {
    id: number;
    title: string;
    content?: string | null;
    summary?: string | null;
    date?: string | null;
    link?: string | null;
  }[];
};


const apiUrl = (path: string) => {
  const base = import.meta.env.API_BASE as string | undefined;
  return base ? `${base}${path}` : `/api${path}`;
};

// ---- helpers -------------------------------------------------
const decodeHTMLEntities = (s?: string | null): string => {
  if (!s) return "";
  let out = s;
  for (let i = 0; i < 3; i++) {
    const ta = document.createElement("textarea");
    ta.innerHTML = out;
    const next = ta.value;
    if (next === out) break;
    out = next;
  }
  return out;
};
const cleanTitle = (t?: string | null): string => {
  let s = decodeHTMLEntities(t);
  s = s.replace(/[“”"]/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
};
const toExcerpt = (raw?: string | null): string => {
  const base = decodeHTMLEntities(raw).replace(/\s+/g, " ").trim();
  if (!base) return "본문 미리보기가 없습니다.";
  return base.length > 50 ? base.slice(0, 50) + "…" : base;
};

// ---- auth utils ----------------------------------------------
export function getToken(): string | null {
  return localStorage.getItem("access_token");
}
export function isAuthed(): boolean {
  return !!getToken();
}

async function authedFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");

  const res = await fetch(input, { ...init, headers });
  return res;
}

// ---- hook -----------------------------------------------------
export default function useBookmarks() {
  const [bookmarks, setBookmarks] = React.useState<Article[]>([]);
  const [savedSet, setSavedSet] = React.useState<Set<number>>(new Set());
  const [loading, setLoading] = React.useState(false);

  const mapArticles = React.useCallback((list: ApiArticle[]): Article[] => {
    return list.map((a) => ({
      id: a.id,
      title: cleanTitle(a.title),
      excerpt: toExcerpt(a.summary ?? a.content),
      time: a.date ?? "",
      press: "네이버 뉴스",
      link: (a.link || "").replace(/&amp;/g, "&"),
      content: a.content ? decodeHTMLEntities(a.content) : null,
    }));
  }, []);

  const load = React.useCallback(async () => {
    // 비로그인이라면 서버 호출하지 않음
    if (!isAuthed()) {
      setBookmarks([]);
      setSavedSet(new Set());
      return;
    }
    setLoading(true);
    try {
      const res = await authedFetch(apiUrl(`/bookmarks`));
      if (res.status === 401) {
        // 토큰 만료 등 → 비로그인 상태로 초기화
        setBookmarks([]);
        setSavedSet(new Set());
        return;
      }
      if (!res.ok) throw new Error(`GET /bookmarks failed ${res.status}`);
      const j: BackendListResponse = await res.json();
      const mapped = mapArticles(j.articles ?? []);
      setBookmarks(mapped);
      setSavedSet(new Set(mapped.map((a) => a.id)));
    } finally {
      setLoading(false);
    }
  }, [mapArticles]);

  // 로그인 상태 변화에 반응
  React.useEffect(() => {
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token") load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [load]);

  const isSaved = React.useCallback((id: number) => savedSet.has(id), [savedSet]);

  const toggle = React.useCallback(
    async (a: Article) => {
      // 호출 전 상위에서 isAuthed() 검사 권장. 방어적으로 한 번 더 체크.
      if (!isAuthed()) {
        const err = new Error("NEED_AUTH");
        (err as any).code = "NEED_AUTH";
        throw err;
      }

      const saved = savedSet.has(a.id);
      if (saved) {
        // optimistic UI
        setSavedSet((s) => {
          const next = new Set(s);
          next.delete(a.id);
          return next;
        });
        setBookmarks((list) => list.filter((x) => x.id !== a.id));

        try {
          const res = await authedFetch(apiUrl(`/bookmarks/${a.id}`), { method: "DELETE" });
          if (res.status === 401) {
            throw Object.assign(new Error("NEED_AUTH"), { code: "NEED_AUTH" });
          }
          if (res.status !== 204) throw new Error("DELETE failed");
        } catch (e) {
          // 롤백
          setSavedSet((s) => {
            const next = new Set(s);
            next.add(a.id);
            return next;
          });
          setBookmarks((list) => [a, ...list]);
          throw e;
        }
      } else {
        // optimistic UI (목록에는 추가하지 않음: 상세/북마크 페이지에서 다시 로드)
        setSavedSet((s) => {
          const next = new Set(s);
          next.add(a.id);
          return next;
        });
        try {
          const res = await authedFetch(apiUrl(`/bookmarks`), {
            method: "POST",
            body: JSON.stringify({ article_id: a.id }),
          });
          if (res.status === 401) {
            throw Object.assign(new Error("NEED_AUTH"), { code: "NEED_AUTH" });
          }
          if (res.status !== 201) throw new Error("POST failed");
        } catch (e) {
          // 롤백
          setSavedSet((s) => {
            const next = new Set(s);
            next.delete(a.id);
            return next;
          });
          throw e;
        }
      }
    },
    [savedSet]
  );

  return { bookmarks, loading, toggle, isSaved, reload: load };
}
