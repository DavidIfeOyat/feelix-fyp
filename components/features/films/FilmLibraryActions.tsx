"use client";

import { useFilmLibrary } from "@/hooks/useFilmLibrary";

function actionClass(active: boolean) {
  return [
    "inline-flex items-center justify-center border-2 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] transition",
    active
      ? "border-black bg-black text-[var(--background)]"
      : "border-black bg-transparent text-[var(--foreground)] hover:bg-black hover:text-[var(--background)]",
  ].join(" ");
}

export default function FilmLibraryActions(props: {
  tmdbId: number;
  title: string;
  poster: string;
  className?: string;
}) {
  const lib = useFilmLibrary({
    tmdbId: props.tmdbId,
    title: props.title,
    poster: props.poster,
  });

  return (
    <div className={props.className ?? "flex flex-wrap gap-2"}>
      <button
        type="button"
        onClick={lib.toggleWatchlist}
        disabled={lib.busy !== null}
        className={actionClass(lib.inWatchlist)}
      >
        {lib.inWatchlist ? "In Watchlist" : "Add to Watchlist"}
      </button>

      <button
        type="button"
        onClick={lib.toggleWatched}
        disabled={lib.busy !== null}
        className={actionClass(lib.isWatched)}
      >
        {lib.isWatched ? "Marked Watched" : "Mark as Watched"}
      </button>

      <button
        type="button"
        onClick={lib.toggleFavorite}
        disabled={lib.busy !== null}
        className={actionClass(lib.isFavorite)}
      >
        {lib.isFavorite ? "In Favourites" : "Add to Favourites"}
      </button>
    </div>
  );
}