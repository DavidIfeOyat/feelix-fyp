"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MovieCard, { type MovieItem } from "@/components/shared/MovieCard";

type FilmsResponse = {
  items: unknown[];
  page: number;
  totalPages: number;
  error?: string;
};

type ListMode = "discover" | "trending" | "new";
type MoodKey = "all" | "funny" | "romantic" | "comforting" | "thrilling" | "dark";
type SortKey = "popularity" | "rating";

type SuggestItem = {
  tmdbId: number;
  title: string;
  year: string;
  poster: string;
  overview: string;
};

const FILMS_PER_PAGE = 40;

const LISTS: { key: ListMode; label: string }[] = [
  { key: "discover", label: "Collection" },
  { key: "trending", label: "Now Showing" },
  { key: "new", label: "Recently Added" },
];

const MOODS: { key: MoodKey; label: string }[] = [
  { key: "all", label: "All Moods" },
  { key: "funny", label: "Funny" },
  { key: "romantic", label: "Romantic" },
  { key: "comforting", label: "Comforting" },
  { key: "thrilling", label: "Thrilling" },
  { key: "dark", label: "Dark" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "popularity", label: "Most Popular" },
  { key: "rating", label: "Highest Rated" },
];

function chip(active: boolean) {
  return [
    "border-2 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] transition",
    active
      ? "border-black bg-black text-[var(--background)]"
      : "border-black bg-transparent text-[var(--foreground)] hover:bg-black hover:text-[var(--background)]",
  ].join(" ");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeMovieItem(item: unknown): MovieItem | null {
  const film = item as {
    tmdbId?: number | string;
    id?: number | string;
    title?: string;
    name?: string;
    poster?: string;
    poster_path?: string;
  };

  const tmdbId = Number(film?.tmdbId ?? film?.id);
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) return null;

  return {
    tmdbId,
    title: String(film?.title ?? film?.name ?? "Untitled"),
    poster: String(film?.poster ?? film?.poster_path ?? "/placeholder.svg"),
  };
}

function buildYears() {
  const currentYear = new Date().getFullYear();
  const years = ["all"];
  for (let year = currentYear; year >= 1970; year--) {
    years.push(String(year));
  }
  return years;
}

export default function FilmsExplorer() {
  const router = useRouter();
  const sp = useSearchParams();

  const list = (sp.get("list") || "discover") as ListMode;
  const mood = (sp.get("mood") || "all") as MoodKey;
  const sort = (sp.get("sort") || "popularity") as SortKey;
  const year = sp.get("year") || "all";
  const page = clamp(Number(sp.get("page") || "1"), 1, 9999);

  const years = useMemo(buildYears, []);
  const [data, setData] = useState<{
    items: MovieItem[];
    page: number;
    totalPages: number;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const searchRootRef = useRef<HTMLDivElement | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [searchBusy, setSearchBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!searchRootRef.current) return;
      if (!searchRootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    const query = q.trim();

    async function run() {
      if (query.length < 2) {
        setSuggestions([]);
        setSearchBusy(false);
        return;
      }

      setSearchBusy(true);

      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`, {
          signal: ctrl.signal,
          cache: "no-store",
        });

        const json = await res.json();
        if (!alive) return;

        const results = Array.isArray(json?.results) ? (json.results as SuggestItem[]) : [];
        setSuggestions(results.slice(0, 8));
        setActiveIdx(0);
        setOpen(true);
      } catch {
        if (!alive) return;
        setSuggestions([]);
      } finally {
        if (alive) setSearchBusy(false);
      }
    }

    const timer = setTimeout(run, 250);

    return () => {
      alive = false;
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  function setQuery(
    next: Partial<{ list: ListMode; mood: MoodKey; sort: SortKey; year: string; page: number }>,
    jumpToTop = false
  ) {
    const merged = {
      list,
      mood,
      sort,
      year,
      page,
      ...next,
    };

    const params = new URLSearchParams();
    params.set("list", merged.list);
    params.set("mood", merged.mood);
    params.set("sort", merged.sort);
    params.set("page", String(merged.page));

    if (merged.year !== "all") {
      params.set("year", merged.year);
    }

    router.replace(`/films?${params.toString()}`, { scroll: false });

    if (jumpToTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function goToFilm(tmdbId: number) {
    setOpen(false);
    router.push(`/films/${tmdbId}`);
  }

  function goToResults() {
    const query = q.trim();
    if (!query) return;
    setOpen(false);
    router.push(`/results?q=${encodeURIComponent(query)}`);
  }

  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const picked = suggestions[activeIdx];
      if (picked) goToFilm(picked.tmdbId);
      else goToResults();
      return;
    }

    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((value) => Math.min(value + 1, Math.max(0, suggestions.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((value) => Math.max(value - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("list", list);
    params.set("mood", mood);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", String(FILMS_PER_PAGE));

    if (year !== "all") {
      params.set("year", year);
    }

    return `/api/films?${params.toString()}`;
  }, [list, mood, sort, year, page]);

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    async function run() {
      setLoading(true);

      try {
        const res = await fetch(apiUrl, {
          signal: ctrl.signal,
          cache: "no-store",
        });

        const json = (await res.json()) as FilmsResponse;
        if (!alive) return;

        const items = (Array.isArray(json.items) ? json.items : [])
          .map(normalizeMovieItem)
          .filter(Boolean) as MovieItem[];

        setData({
          items,
          page: Number(json.page ?? 1),
          totalPages: Number(json.totalPages ?? 1),
          error: json.error,
        });
      } catch {
        if (!alive) return;
        setData({
          items: [],
          page: 1,
          totalPages: 1,
          error: "Failed to load films.",
        });
      } finally {
        if (alive) setLoading(false);
      }
    }

    void run();

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [apiUrl]);

  const totalPages = clamp(data?.totalPages ?? 1, 1, 9999);
  const visibleItems = (data?.items ?? []).slice(0, FILMS_PER_PAGE);

  return (
    <section className="container py-6 sm:py-8 md:py-10">
      <div className="grid gap-6">
        <div className="border-2 border-black bg-[var(--surface)]">
          <div className="border-b-2 border-black px-5 py-4 sm:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
              Film explorer
            </p>
            <div className="mt-3 grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <h1 className="text-4xl font-extrabold uppercase leading-[0.9] tracking-[-0.08em] text-[var(--foreground)] sm:text-5xl md:text-6xl">
                Browse the collection.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-base">
                Explore films by collection mode, mood, year, and ranking, with quick search
                built into the same archive view.
              </p>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-6">
            <div className="grid gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                Collection mode
              </p>
              <div className="flex flex-wrap gap-2">
                {LISTS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={chip(list === item.key)}
                    onClick={() => setQuery({ list: item.key, page: 1 })}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                Search
              </p>

              <div ref={searchRootRef} className="relative w-full max-w-2xl">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length) setOpen(true);
                  }}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Search films"
                  className="w-full"
                />

                {open && q.trim().length >= 2 ? (
                  <div className="absolute left-0 right-0 z-50 mt-2 border-2 border-black bg-[var(--background)] shadow-[4px_4px_0_rgba(17,17,17,0.12)]">
                    <div className="max-h-[320px] overflow-auto">
                      {suggestions.length === 0 ? (
                        <div className="px-4 py-4 text-sm text-[var(--muted)]">
                          {searchBusy ? "Searching..." : "No results."}
                        </div>
                      ) : (
                        suggestions.map((item, idx) => (
                          <button
                            key={item.tmdbId}
                            type="button"
                            onMouseEnter={() => setActiveIdx(idx)}
                            onClick={() => goToFilm(item.tmdbId)}
                            className={`grid w-full grid-cols-[56px_1fr] gap-3 border-b border-black px-4 py-3 text-left transition last:border-b-0 ${
                              idx === activeIdx
                                ? "bg-black text-[var(--background)]"
                                : "bg-transparent text-[var(--foreground)] hover:bg-black hover:text-[var(--background)]"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.poster || "/placeholder.svg"}
                              alt=""
                              className="h-16 w-14 border border-black object-cover"
                            />

                            <div className="min-w-0">
                              <div className="truncate text-[11px] font-bold uppercase tracking-[0.14em]">
                                {item.title} {item.year ? `(${item.year})` : ""}
                              </div>
                              <div className="mt-2 line-clamp-2 text-xs opacity-80">
                                {item.overview || "No overview available."}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t-2 border-black px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                      <span>Press enter for full search</span>
                      <button
                        type="button"
                        onClick={goToResults}
                        className="text-[var(--foreground)] underline-offset-4 hover:underline"
                      >
                        See all
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-5 border-t-2 border-black pt-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="grid gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Mood filter
                </p>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={chip(mood === item.key)}
                      onClick={() => setQuery({ mood: item.key, page: 1 })}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
                <label className="grid gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Year
                  </span>
                  <select
                    value={year}
                    onChange={(e) => setQuery({ year: e.target.value, page: 1 })}
                  >
                    {years.map((item) => (
                      <option key={item} value={item}>
                        {item === "all" ? "All years" : item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Sort
                  </span>
                  <select
                    value={sort}
                    onChange={(e) => setQuery({ sort: e.target.value as SortKey, page: 1 })}
                  >
                    {SORTS.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div>
          {data?.error ? (
            <div className="mb-5 border-2 border-black bg-[var(--surface-strong)] px-4 py-4 text-sm text-[var(--foreground)]">
              {data.error}
            </div>
          ) : null}

          <div className="mb-5 flex flex-col gap-2 border-b-2 border-black pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                Results
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">
                Showing {visibleItems.length} films
              </p>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Page {page} of {totalPages}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse overflow-hidden border-2 border-black bg-[var(--surface)]"
                  >
                    <div className="aspect-[2/3] border-b-2 border-black bg-[var(--surface-strong)]" />
                    <div className="space-y-3 p-4">
                      <div className="h-3 w-20 bg-black/10" />
                      <div className="h-7 w-full bg-black/10" />
                      <div className="h-px w-full bg-black/20" />
                      <div className="h-3 w-16 bg-black/10" />
                    </div>
                  </div>
                ))
              : visibleItems.map((item) => <MovieCard key={item.tmdbId} item={item} />)}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t-2 border-black pt-5 sm:mt-10 sm:flex-row sm:items-center sm:justify-center">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={page <= 1}
              onClick={() => setQuery({ page: page - 1 }, true)}
            >
              Previous
            </button>

            <div className="border-2 border-black px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--foreground)]">
              Page {page} of {totalPages}
            </div>

            <button
              type="button"
              className="btn btn-ghost"
              disabled={page >= totalPages}
              onClick={() => setQuery({ page: page + 1 }, true)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}