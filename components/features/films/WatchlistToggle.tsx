"use client";

import { useState } from "react";
import { useFilmLibrary } from "@/hooks/useFilmLibrary";
import type { MovieItem } from "@/components/shared/MovieCard";

export default function WatchlistToggle({ item }: { item: MovieItem }) {
  const lib = useFilmLibrary({
    tmdbId: item.tmdbId,
    title: item.title,
    poster: item.poster,
  });

  const [msg, setMsg] = useState<string | null>(null);

  async function add() {
    setMsg(null);
    if (lib.inWatchlist) {
      setMsg("Already in watchlist.");
      return;
    }
    await lib.toggleWatchlist();
    setMsg("Added to watchlist.");
  }

  async function remove() {
    setMsg(null);
    if (!lib.inWatchlist) {
      setMsg("Not in watchlist.");
      return;
    }
    await lib.toggleWatchlist();
    setMsg("Removed from watchlist.");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={add} disabled={lib.busy !== null}>
          {lib.busy ? "Saving…" : "Add to watchlist"}
        </button>
        <button className="btn btn-ghost" onClick={remove} disabled={lib.busy !== null}>
          {lib.busy ? "Removing…" : "Remove"}
        </button>
      </div>
      {msg ? <p className="text-xs text-[--color-muted]">{msg}</p> : null}
    </div>
  );
}