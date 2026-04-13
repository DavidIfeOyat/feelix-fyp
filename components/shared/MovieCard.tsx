"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFilmLibrary } from "@/hooks/useFilmLibrary";
import WatchedFeedbackModal from "@/components/movie/WatchedFeedbackModal";

export type MovieItem = {
  tmdbId: number;
  title: string;
  poster: string;
};

const menuItemClass =
  "block w-full rounded-lg px-3 py-2 text-left hover:bg-white/10 disabled:opacity-50";

export default function MovieCard({ item }: { item: MovieItem }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const lib = useFilmLibrary({
    tmdbId: item.tmdbId,
    title: item.title,
    poster: item.poster,
  });

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }

    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function handleWatched() {
    const result = await lib.toggleWatched();
    setMenuOpen(false);

    if (result === "added") {
      setFeedbackOpen(true);
    }
  }

  return (
    <>
      <article className="relative overflow-visible border-2 border-black bg-[var(--surface)]">
        <div className="overflow-hidden">
          <Link href={`/films/${item.tmdbId}`} className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.poster || "/placeholder.svg"}
              alt={item.title}
              className="aspect-[2/3] w-full object-cover transition duration-200 lg:hover:scale-[1.02]"
            />
          </Link>
        </div>

        <div className="absolute right-2 top-2 z-40 hidden lg:block" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="grid h-9 w-9 place-items-center border-2 border-black bg-[var(--surface-strong)] text-sm text-[var(--foreground)] transition hover:bg-black hover:text-[var(--background)]"
            aria-label="Film menu"
            title="Film menu"
          >
            ⋯
          </button>

          {menuOpen ? (
            <div className="absolute right-0 mt-2 w-[220px] border-2 border-black bg-[var(--background)] p-1 text-sm shadow-lg">
              <button
                type="button"
                onClick={async () => {
                  await lib.toggleWatchlist();
                  setMenuOpen(false);
                }}
                disabled={lib.busy !== null}
                className={menuItemClass}
              >
                {lib.inWatchlist ? "✓ In Watchlist" : "Add to Watchlist"}
              </button>

              <button
                type="button"
                onClick={handleWatched}
                disabled={lib.busy !== null}
                className={menuItemClass}
              >
                {lib.isWatched ? "✓ Watched" : "Mark as Watched"}
              </button>

              <button
                type="button"
                onClick={async () => {
                  await lib.toggleFavorite();
                  setMenuOpen(false);
                }}
                disabled={lib.busy !== null}
                className={menuItemClass}
              >
                {lib.isFavorite ? "♥ Favorited" : "♡ Favorite"}
              </button>

              <div className="my-1 h-px bg-black/20" />

              <Link
                href={`/films/${item.tmdbId}?tab=trailer`}
                onClick={() => setMenuOpen(false)}
                className={menuItemClass}
              >
                Watch Trailer
              </Link>

              <Link
                href={`/films/${item.tmdbId}?tab=stream`}
                onClick={() => setMenuOpen(false)}
                className={menuItemClass}
              >
                Where to Watch
              </Link>
            </div>
          ) : null}
        </div>

        <div className="hidden border-t-2 border-black p-3 lg:block">
          <Link href={`/films/${item.tmdbId}`} className="block">
            <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-extrabold uppercase leading-[0.95] tracking-[-0.05em] text-[var(--foreground)]">
              {item.title}
            </h3>
          </Link>
        </div>
      </article>

      <WatchedFeedbackModal
        open={feedbackOpen}
        title={item.title}
        onClose={() => setFeedbackOpen(false)}
        onSubmit={(liked) => lib.saveWatchedFeedback(liked)}
      />
    </>
  );
}