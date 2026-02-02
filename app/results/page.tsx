// app/results/page.tsx
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
  match: number; // 0..1
  bestDeal: { provider: string; type: string; region: string };
  poster?: string;
};

const RESULTS_KEY = 'feelix_results_v1';
const WATCHLIST_KEY = 'feelix_watchlist_v1';

export default function ResultsPage() {
  const [items, setItems] = useState<Rec[] | null>(null);
  const [watchlist, setWatchlist] = useState<Rec[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RESULTS_KEY);
      setItems(raw ? JSON.parse(raw) : []);
      const wl = localStorage.getItem(WATCHLIST_KEY);
      setWatchlist(wl ? JSON.parse(wl) : []);
    } catch {
      setItems([]);
    }
  }, []);

  const saveToWatchlist = (rec: Rec) => {
    const next = [...watchlist];
    if (!next.find((x) => x.tmdbId === rec.tmdbId)) {
      next.push(rec);
      setWatchlist(next);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
    }
  };

  if (items === null) {
    return <div className="min-h-[60vh] grid place-items-center">Loading…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">No results yet</h1>
          <p className="text-neutral-600 mt-2">Start by telling us your vibe.</p>
          <Link href="/onboarding" className="inline-flex mt-4 rounded-xl px-4 py-2 bg-black text-white font-semibold">
            Go to onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-[#eaeaea] text-neutral-900 min-h-[80vh]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Your picks</h1>
            <p className="text-neutral-600 mt-1">Top five that match your current vibe.</p>
          </div>
          <Link href="/watchlist" className="rounded-xl px-3 py-2 bg-white border border-black/10 font-semibold hover:bg-white/80">
            Watchlist ({watchlist.length})
          </Link>
        </div>

        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <li key={m.id} className="rounded-2xl border border-black/10 bg-white shadow-sm overflow-hidden">
              {/* Poster */}
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

              {/* Body */}
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
                    onClick={() => saveToWatchlist(m)}
                    className="ml-auto rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm hover:bg-white/80"
                  >
                    Save
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <Link href="/onboarding" className="rounded-xl px-4 py-2 bg-white border border-black/10 font-semibold hover:bg-white/80">
            Try different vibes
          </Link>
        </div>
      </div>
    </section>
  );
}
