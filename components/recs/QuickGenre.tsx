// components/recs/QuickGenre.tsx
"use client";

import { useState } from "react";
import SignUpPrompt from "../features/auth/SignUpPrompt";

const GENRES = ["Action", "Comedy", "Drama", "Romance", "Sci-Fi", "Thriller"];

export default function QuickGenre() {
  const [genre, setGenre] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const clickGenre = (g: string) => {
    setGenre(g);
    // Show one dummy result and then encourage sign-up for filters
    setShowPrompt(true);
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Try a quick pick</h2>
      <div className="flex flex-wrap gap-2">
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => clickGenre(g)}
            className="chip hover:bg-white/16"
            type="button"
          >
            {g}
          </button>
        ))}
      </div>

      {genre && (
        <div className="mt-4 surface p-4">
          <div className="text-sm mb-2">Top-rated {genre} (sample):</div>
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
            <div className="rounded-[--radius-xl] overflow-hidden border border-[--color-border] bg-[--color-surface]">
              <div className="aspect-[2/3] bg-white/10" />
              <div className="p-2 text-sm">{genre} Example</div>
            </div>
          </div>
        </div>
      )}

      {showPrompt && <SignUpPrompt reason="Filter by platform, year, and more." />}
    </div>
  );
}
