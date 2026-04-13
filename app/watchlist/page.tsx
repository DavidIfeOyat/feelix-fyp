"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MovieCard, { type MovieItem } from "@/components/shared/MovieCard";
import { useAuth } from "@/hooks/useAuth";
import { createSupabaseBrowser } from "@/lib/supabase/client";

const ITEMS_PER_PAGE = 40;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function WatchlistPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [items, setItems] = useState<MovieItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
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

      setError(null);

      const { data, error: qErr } = await supabase
        .from("watchlist_items")
        .select("external_id,title,poster,payload,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (qErr) {
        setError(qErr.message);
        setItems([]);
        return;
      }

      const mapped: MovieItem[] = (data ?? [])
        .map((row: any) => {
          const tmdbId = Number(row?.payload?.tmdbId ?? row?.external_id);
          if (!Number.isFinite(tmdbId)) return null;

          return {
            tmdbId,
            title: String(row?.title ?? "Untitled"),
            poster: String(row?.poster ?? "/placeholder.svg"),
          };
        })
        .filter(Boolean) as MovieItem[];

      // Keeps the grid stable if duplicate rows exist in storage.
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

  // Resets pagination when the dataset changes.
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
          <h1 className="text-2xl font-extrabold">Sign in to view Watchlist</h1>
          <p className="mt-2 text-[--color-muted]">Your intent list lives here.</p>

          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Link className="btn btn-primary" href="/login?from=/watchlist">
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
          <h1 className="text-2xl font-extrabold">Watchlist</h1>
        </div>

        <Link className="text-sm text-[--color-muted] hover:underline" href="/films">
          Browse films →
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-[--radius-xl] border border-white/10 bg-white/5 p-4">
          ⚠️ {error}
        </div>
      ) : null}

      {totalItems === 0 ? (
        <div className="mt-6 card p-6 text-center sm:p-7">
          <p className="text-[--color-muted]">No films in your watchlist yet.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {pagedItems.map((item) => (
              <MovieCard key={`wl-${item.tmdbId}`} item={item} />
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