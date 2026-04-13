"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MovieCard, { type MovieItem } from "@/components/shared/MovieCard";

type ListKey = "trending" | "new" | "leaving";

export default function FilmShelf({
  title,
  list,
  browseHref = "/films",
}: {
  title: string;
  list: ListKey;
  browseHref?: string;
}) {
  const [items, setItems] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/films?list=${list}&limit=6`);
        const json = await res.json();

        const mapped: MovieItem[] = (json.items || [])
          .map((m: any) => ({
            tmdbId: Number(m.tmdbId ?? m.tmdb_id ?? m.id),
            title: String(m.title ?? "Untitled"),
            poster: String(m.poster ?? "/placeholder.svg"),
          }))
          .filter((x: MovieItem) => Number.isFinite(x.tmdbId));

        if (alive) setItems(mapped);
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [list]);

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-tight md:text-xl">{title}</h2>
        <Link
          href={browseHref}
          className="no-underline text-sm text-[--color-muted] hover:opacity-80"
        >
          Browse →
        </Link>
      </div>

      {loading ? (
        <p className="mt-4 text-[--color-muted]">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-[--color-muted]">No films available.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {items.map((it) => (
            <MovieCard key={String(it.tmdbId)} item={it} />
          ))}
        </div>
      )}
    </section>
  );
}