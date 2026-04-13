"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import MovieCard, { type MovieItem } from "@/components/shared/MovieCard";
import { useAuth } from "@/hooks/useAuth";
import { createSupabaseBrowser } from "@/lib/supabase/client";

const LS_FAVORITES = "feelix_favorites_v1";
const ITEMS_PER_PAGE = 40;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function readLocal(): Record<string, MovieItem> {
  try {
    return JSON.parse(localStorage.getItem(LS_FAVORITES) || "{}");
  } catch {
    return {};
  }
}

// Converts a favorites row into the smaller card shape used on the page.
function rowToItem(row: any): MovieItem | null {
  if (!row) return null;

  const tmdbId = Number(row.payload?.tmdbId ?? row.external_id);
  if (!Number.isFinite(tmdbId)) return null;

  return {
    tmdbId,
    title: String(row.title ?? "Untitled"),
    poster: String(row.poster ?? "/placeholder.svg"),
  };
}

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [items, setItems] = useState<MovieItem[]>([]);
  const [source, setSource] = useState<"local" | "cloud">("local");
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const reqId = useRef(0);

  async function load() {
    const myReq = ++reqId.current;
    setLoading(true);
    setBanner(null);

    // Local data is shown first so the page does not flash empty.
    const localMap = readLocal();
    const localItems = Object.values(localMap).filter(Boolean);
    setItems(localItems);
    setSource("local");

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("favorites_items")
        .select("external_id, title, poster, payload, created_at")
        .order("created_at", { ascending: false });

      if (myReq !== reqId.current) return;
      if (error) throw error;

      const cloud = (data ?? [])
        .map(rowToItem)
        .filter((item): item is MovieItem => Boolean(item));

      if (cloud.length > 0) {
        setItems(cloud);
        setSource("cloud");
      } else if (localItems.length > 0) {
        setItems(localItems);
        setSource("local");
        setBanner("Your favourites are saved on this device only.");
      } else {
        setItems([]);
        setSource("cloud");
      }
    } catch (e: any) {
      if (myReq !== reqId.current) return;
      setSource("local");
      setBanner(e?.message ? `Cloud load failed: ${e.message}` : "Cloud load failed.");
    } finally {
      if (myReq === reqId.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    load();
    // load is intentionally tied to the signed-in user here
    // so the page rehydrates cleanly when auth state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Resets pagination after a data refresh.
  useEffect(() => {
    setPage(1);
  }, [items.length]);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safePage = clamp(page, 1, totalPages);

  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, safePage]);

  function goToPage(nextPage: number) {
    setPage(clamp(nextPage, 1, totalPages));
    window.scrollTo({ top: 0 });
  }

  if (authLoading || loading) {
    return <p className="container py-10">Loading favourites…</p>;
  }

  return (
    <section className="container py-8 sm:py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Favourites</h1>
          <p className="text-[--color-muted]">
            {user
              ? source === "cloud"
                ? "Saved to your account."
                : "Saved locally on this device."
              : "Not signed in — saved locally on this device."}
          </p>
        </div>

        {!user ? (
          <div className="flex items-center gap-2">
            <Link href="/login?from=/favorites" className="btn btn-primary">
              Sign in
            </Link>
          </div>
        ) : null}
      </div>

      {banner ? (
        <div className="mb-6 rounded-[--radius-xl] border border-white/10 bg-white/5 p-4">
          <p>{banner}</p>
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-[--radius-xl] border border-white/10 bg-white/5 p-6 text-center sm:p-8">
          <p className="mb-3">No favourites added yet.</p>

          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Link href="/films" className="btn btn-primary">
              Browse films
            </Link>
            <Link href="/" className="btn btn-ghost">
              Back home
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
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