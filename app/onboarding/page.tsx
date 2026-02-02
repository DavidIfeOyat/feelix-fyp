// app/onboarding/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const RESULTS_KEY = 'feelix_results_v1';

const ALL_MOODS = ["cozy","thrilling","weepy","quirky","uplifting","tense"];
const ALL_GENRES = ["Action","Drama","Comedy","Romance","Sci-Fi","Thriller","Horror","Animation"];

export default function OnboardingPage() {
  const router = useRouter();
  const [region, setRegion] = useState<'GB'|'US'>('GB');
  const [moods, setMoods] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [runtime, setRuntime] = useState(200);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string|undefined>();

  const toggle = (arr: string[], value: string, set: (next: string[])=>void) => {
    set(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  const submit = async () => {
  setLoading(true); setErr(undefined);
  try {
    const res = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        region,
        moods,
        genres,
        vetoes: [],
        subscriptions: [],
        maxRuntime: runtime,
      }),
    });

    // ⬇️ Robust: don’t try to JSON-parse an HTML error page
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Server returned ${res.status}. First bytes: ${text.slice(0,120)}`);
    }

    const data = await res.json();
    if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to fetch recommendations.');

    localStorage.setItem('feelix_results_v1', JSON.stringify(data.items));
    router.push('/results');
  } catch (e: any) {
    setErr(e?.message || 'Something went wrong.');
  } finally {
    setLoading(false);
  }
};


  return (
    <section className="min-h-[70vh] bg-[#eaeaea] text-neutral-900">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Tell us your vibe</h1>
        <p className="text-neutral-600 mt-2">Pick a region and a few moods/genres. We’ll generate a shortlist.</p>

        <div className="mt-6 space-y-6 rounded-2xl bg-white border border-black/10 p-6">
          <div>
            <label className="text-sm font-semibold">Region</label>
            <select
              value={region}
              onChange={(e)=>setRegion(e.target.value as 'GB'|'US')}
              className="mt-1 w-40 rounded-xl border border-black/10 bg-white px-3 py-2"
            >
              <option value="GB">GB (UK)</option>
              <option value="US">US</option>
            </select>
          </div>

          <div>
            <div className="text-sm font-semibold">Moods</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {ALL_MOODS.map((m) => (
                <button
                  key={m}
                  onClick={()=>toggle(moods, m, setMoods)}
                  className={`rounded-full px-3 py-1.5 text-sm border ${moods.includes(m) ? 'bg-black text-white' : 'bg-white text-neutral-900'} border-black/10`}
                  type="button"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold">Genres</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {ALL_GENRES.map((g) => (
                <button
                  key={g}
                  onClick={()=>toggle(genres, g, setGenres)}
                  className={`rounded-full px-3 py-1.5 text-sm border ${genres.includes(g) ? 'bg-black text-white' : 'bg-white text-neutral-900'} border-black/10`}
                  type="button"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Max runtime: {runtime} min</label>
            <input
              className="mt-2 w-full"
              type="range"
              min={60}
              max={240}
              step={10}
              value={runtime}
              onChange={(e)=>setRuntime(Number(e.target.value))}
            />
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="pt-2">
            <button
              onClick={submit}
              disabled={loading}
              className="rounded-xl bg-black text-white px-5 py-2 font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Finding picks…' : 'See suggestions'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
