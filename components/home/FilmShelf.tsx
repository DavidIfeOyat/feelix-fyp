"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MovieCard, { type MovieItem } from "@/components/shared/MovieCard";

type FilmsResponse = {
  items: MovieItem[];
  page: number;
  totalPages: number;
  error?: string;
};

function ensureItemShape(it: unknown): MovieItem {
  const film = it as Partial<MovieItem> & { title?: string; poster?: string };
  return {
    tmdbId: Number(film?.tmdbId ?? 0),
    title: String(film?.title ?? "Untitled"),
    poster: String(film?.poster ?? "/placeholder.svg"),
  };
}

export default function FilmShelf({
  title,
  subtitle,
  list,
  browseHref,
  isAuthed,
}: {
  title: string;
  subtitle?: string;
  list: "trending" | "new";
  browseHref: string;
  isAuthed: boolean;
}) {
  const [data, setData] = useState<FilmsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const browseTarget = useMemo(() => `${browseHref}?list=${list}`, [browseHref, list]);
  const href = useMemo(
    () => (isAuthed ? browseTarget : `/login?from=${encodeURIComponent(browseTarget)}`),
    [isAuthed, browseTarget]
  );

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    async function run() {
      setLoading(true);

      try {
        const response = await fetch(`/api/films?list=${list}&mood=all&page=1`, {
          signal: ctrl.signal,
          cache: "no-store",
        });

        const json = (await response.json()) as FilmsResponse;

        if (!alive) return;

        setData({
          ...json,
          items: Array.isArray(json.items) ? json.items.map(ensureItemShape) : [],
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
  }, [list]);

  const items = (data?.items ?? []).slice(0, 6);

  return (
    <section className="mt-12 border-t-2 border-black pt-6 sm:mt-16 sm:pt-8">
      <div className="flex flex-col gap-4 border-b-2 border-black pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            Shelf
          </p>

          <h2 className="mt-2 text-3xl font-extrabold uppercase leading-none tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
            {title}
          </h2>

          {subtitle ? (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              {subtitle}
            </p>
          ) : null}
        </div>

        <Link href={href} className="btn btn-ghost self-start sm:self-auto">
          Browse all
        </Link>
      </div>

      {data?.error ? (
        <div className="mt-5 border-2 border-black bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground)]">
          {data.error}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
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
          : items.map((it) => <MovieCard key={it.tmdbId || it.title} item={it} />)}
      </div>
    </section>
  );
}