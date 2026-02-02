// app/watchlist/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Rec = {
  id: number;
  tmdbId: number;
  title: string;
  ageRating: string | null;
  runtime: number | null;
  genres: string[];
  match: number;
  bestDeal: { provider: string; type: string; region: string };
  poster?: string;
};

const WATCHLIST_KEY = 'feelix_watchlist_v1';

export default function WatchlistPage() {
  const [items, setItems] = useState<Rec[]>([]);

  useEffect(() => {
    try {
      const wl = localStorage.getItem(WATCHLIST_KEY);
      setItems(wl ? JSON.parse(wl) : []);
    } catch {
      setItems([]);
    }
  }, []);

  const removeItem = (tmdbId: number) => {
    const next = items.filter((x) => x.tmdbId !== tmdbId);
    setItems(next);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
  };

  return (
    <section className="bg-[#eaeaea] text-neutral-900 min-h-[80vh]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Watchlist</h1>
            <p className="text-neutral-600 mt-1">Saved picks across sessions (local device).</p>
          </div>
          <Link href="/results" className="rounded-xl px-3 py-2 bg-white border border-black/10 font-semibold hover:bg-white/80">
            Back to results
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 text-neutral-600">No saved items yet.</div>
        ) : (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((m) => (
              <li key={m.tmdbId} className="rounded-2xl border border-black/10 bg-white shadow-sm overflow-hidden">
                <div className="relative aspect-[2/3] bg-neutral-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {m.poster ? (
                    <img src={m.poster} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-neutral-500">Poster</div>
                  )}
                  <div className="absolute left-3 top-3 rounded-full bg-black text-white text-xs font-semibold px-2 py-1">
                    {(m.match * 100).toFixed(0)}% Match
                  </div>
                </div>
                <div className="p-5">
                  <div className="font-semibold text-lg">{m.title}</div>
                  <div className="text-sm text-neutral-600 mt-0.5">
                    {(m.ageRating ?? 'NR')} • {(m.runtime ?? '—')} min
                  </div>
                  <div className="text-sm mt-2">{(m.genres ?? []).join(', ')}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-black text-white px-2 py-1 text-xs">
                      {m.bestDeal.provider} · {m.bestDeal.type}
                    </span>
                    <button
                      onClick={() => removeItem(m.tmdbId)}
                      className="ml-auto rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm hover:bg-white/80"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
