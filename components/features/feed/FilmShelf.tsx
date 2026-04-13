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

function ensureItemShape(it: any): MovieItem {
  return {
    tmdbId: it?.tmdbId,
    id: it?.id,
    title: String(it?.title ?? "Untitled"),
    poster: String(it?.poster ?? "/placeholder.svg"),
    ageRating: String(it?.ageRating ?? "NR"),
    runtime: Number(it?.runtime ?? 0),
    genres: Array.isArray(it?.genres) ? it.genres : [],
    bestDeal: it?.bestDeal ?? undefined,
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
        const r = await fetch(`/api/films?list=${list}&mood=all&page=1`, {
          signal: ctrl.signal,
          cache: "no-store",
        });

        const j = (await r.json()) as FilmsResponse;

        if (!alive) return;

        setData({
          ...j,
          items: Array.isArray(j.items) ? j.items.map(ensureItemShape) : [],
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
    <section className="mt-10 sm:mt-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-[--color-muted]">{subtitle}</p>
          ) : null}
        </div>

        <Link className="btn btn-ghost self-start sm:self-auto" href={href}>
          Browse all
        </Link>
      </div>

      {data?.error ? (
        <div className="mt-4 rounded-[--radius-xl] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {data.error}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 sm:gap-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-[--radius-xl] border border-white/10 bg-white/5 animate-pulse"
              >
                <div className="aspect-[2/3] bg-black/30" />
                <div className="space-y-2 p-3">
                  <div className="h-4 rounded bg-white/10" />
                  <div className="h-3 w-2/3 rounded bg-white/10" />
                </div>
              </div>
            ))
          : items.map((it) => (
              <MovieCard key={it.tmdbId ?? it.title} item={it} variant="discover" />
            ))}
      </div>
    </section>
  );
}