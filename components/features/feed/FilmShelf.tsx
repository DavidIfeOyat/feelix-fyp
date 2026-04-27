"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import MovieCard, { type MovieItem } from "@/components/shared/MovieCard";

type ListKey = "trending" | "new" | "leaving";

type FilmShelfProps = {
  title: string;
  list: ListKey;
  browseHref?: string;
};

type FilmShelfApiItem = {
  tmdbId?: unknown;
  tmdb_id?: unknown;
  id?: unknown;
  title?: unknown;
  poster?: unknown;
};

type FilmShelfApiResponse = {
  items?: FilmShelfApiItem[];
};

export default function FilmShelf({
  title,
  list,
  browseHref = "/films",
}: FilmShelfProps) {
  const [items, setItems] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadShelf() {
      setLoading(true);

      try {
        const res = await fetch(`/api/films?list=${list}&limit=6`);
        const json = (await res.json()) as FilmShelfApiResponse;

        const mapped: MovieItem[] = (json.items || [])
          .map((movie) => ({
            tmdbId: Number(movie.tmdbId ?? movie.tmdb_id ?? movie.id),
            title: String(movie.title ?? "Untitled"),
            poster: String(movie.poster ?? "/placeholder.svg"),
          }))
          .filter((item) => Number.isFinite(item.tmdbId));

        if (alive) {
          setItems(mapped);
        }
      } catch {
        if (alive) {
          setItems([]);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadShelf();

    return () => {
      alive = false;
    };
  }, [list]);

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-tight md:text-xl">
          {title}
        </h2>

        <Link
          href={browseHref}
          className="text-sm text-[--color-muted] no-underline hover:opacity-80"
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
          {items.map((item) => (
            <MovieCard key={String(item.tmdbId)} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}