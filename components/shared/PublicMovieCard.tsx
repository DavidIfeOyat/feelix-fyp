"use client";

import Link from "next/link";
import type { MovieItem } from "@/components/shared/MovieCard";

export default function PublicMovieCard({ item }: { item: MovieItem }) {
  return (
    <article className="group overflow-hidden border-2 border-black bg-[var(--surface)]">
      <div className="bg-[var(--surface-strong)]">
        <Link href={`/films/${item.tmdbId}`} className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.poster || "/placeholder.svg"}
            alt={item.title}
            className="aspect-[2/3] w-full object-cover transition duration-200 lg:group-hover:scale-[1.01]"
          />
        </Link>
      </div>

      <div className="hidden gap-3 border-t-2 border-black p-4 lg:grid">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            Public Shelf
          </p>

          <Link href={`/films/${item.tmdbId}`} className="block">
            <h3 className="mt-2 line-clamp-2 text-lg font-extrabold uppercase leading-[0.95] tracking-[-0.05em] text-[var(--foreground)]">
              {item.title}
            </h3>
          </Link>
        </div>

        <div className="border-t border-black pt-3">
          <Link
            href={`/films/${item.tmdbId}`}
            className="inline-block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--foreground)] underline-offset-4 hover:underline"
          >
            View Film
          </Link>
        </div>
      </div>
    </article>
  );
}