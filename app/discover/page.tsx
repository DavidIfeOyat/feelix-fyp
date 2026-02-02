'use client';

import { useEffect, useState } from "react";

type Film = {
  id: number;
  tmdb_id: number;
  title: string;
  age_rating: string | null;
  runtime: number | null;
  genres: string[] | null;
};

export default function DiscoverPage() {
  const [rows, setRows] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/films", { cache: "no-store" });
        const json = await res.json();
        setRows(json.rows ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="container py-10">
      <h1 className="text-2xl font-bold">Discover</h1>
      <p className="text-[--color-muted] mt-1">Supabase → API → UI (no auth).</p>

      {loading ? (
        <div className="mt-6 opacity-80">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="mt-6 opacity-80">No films yet.</div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(f => (
            <li key={f.id} className="card p-4">
              <div className="font-semibold">{f.title}</div>
              <div className="text-sm text-[--color-muted] mt-1">
                {(f.age_rating || "NR")} • {(f.runtime ?? "—")} min
              </div>
              <div className="text-sm mt-1">{(f.genres ?? []).join(", ")}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
