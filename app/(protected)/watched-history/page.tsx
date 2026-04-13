"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MovieCard, { type MovieItem } from "@/components/shared/MovieCard";
import { useAuth } from "@/hooks/useAuth";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type WatchedRow = {
  external_id: string;
  title: string | null;
  poster: string | null;
  watched_at: string | null;
  payload: any;
};

const ITEMS_PER_PAGE = 40;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function WatchedHistoryPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [items, setItems] = useState<MovieItem[] | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (loading) return;

      if (!user) {
        if (!alive) return;
        setItems([]);
        return;
      }

      const { data, error } = await supabase
        .from("watched_items")
        .select("external_id,title,poster,watched_at,payload")
        .eq("user_id", user.id)
        .order("watched_at", { ascending: false });

      if (!alive) return;

      if (error) {
        console.error("watched_items fetch failed:", error);
        setItems([]);
        return;
      }

      const mapped: MovieItem[] = ((data as WatchedRow[] | null) ?? [])
        .map((row) => {
          const tmdbId = Number(row?.payload?.tmdbId ?? row.external_id);
          if (!Number.isFinite(tmdbId)) return null;

          return {
            tmdbId,
            title: row.title ?? "Untitled",
            poster: row.poster ?? "/placeholder.svg",
          };
        })
        .filter(Boolean) as MovieItem[];

      // Keeps the history view clean if duplicate rows exist.
      const seen = new Set<number>();
      const unique: MovieItem[] = [];

      for (const item of mapped) {
        if (seen.has(item.tmdbId)) continue;
        seen.add(item.tmdbId);
        unique.push(item);
      }

      setItems(unique);
    }

    run();

    return () => {
      alive = false;
    };
  }, [loading, user?.id, supabase]);

  // Returns the user to page 1 whenever the dataset changes.
  useEffect(() => {
    setPage(1);
  }, [items?.length]);

  const totalItems = items?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safePage = clamp(page, 1, totalPages);

  const pagedItems = useMemo(() => {
    if (!items) return [];
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, safePage]);

  function goToPage(nextPage: number) {
    setPage(clamp(nextPage, 1, totalPages));
    window.scrollTo({ top: 0 });
  }

  if (loading || items === null) {
    return <p className="container py-10">Loading…</p>;
  }

  if (!user) {
    return (
      <section className="container py-8 sm:py-10">
        <div className="card p-6 text-center sm:p-7">
          <h1 className="text-2xl font-extrabold">Sign in to view Watch History</h1>
          <p className="mt-2 text-[--color-muted]">This powers your recommendations.</p>

          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Link className="btn btn-primary" href="/login?from=/watched-history">
              Sign in
            </Link>
            <Link className="btn btn-ghost" href="/signup">
              Create account
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-8 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Watched History</h1>
        </div>

        <Link className="text-sm text-[--color-muted] hover:underline" href="/films">
          Browse films →
        </Link>
      </div>

      {totalItems === 0 ? (
        <div className="mt-6 card p-6 text-center sm:p-7">
          <p className="text-[--color-muted]">No watched films yet.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {pagedItems.map((item) => (
              <MovieCard key={item.tmdbId} item={item} />
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 sm:mt-10">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={safePage <= 1}
              onClick={() => goToPage(safePage - 1)}
            >
              ← Prev
            </button>

            <button type="button" className="btn btn-ghost" disabled>
              Page {safePage} of {totalPages}
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              disabled={safePage >= totalPages}
              onClick={() => goToPage(safePage + 1)}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </section>
  );
}