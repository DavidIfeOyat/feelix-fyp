'use client'
import { useEffect, useState } from 'react'

type Item = {
  id: string
  title: string
  poster: string
  ageRating: string
  runtime: number
  genres: string[]
  bestDeal?: { provider: string; type: 'stream' | 'rent' | 'buy'; region: 'GB' | 'US'; }
}

export default function RecommendationsPage() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/recommendations', { method: 'POST' })
        const j = await r.json()
        setItems(j.items ?? [])
      } catch (e: any) {
        setErr(e?.message ?? 'Failed to load')
      }
    })()
  }, [])

  if (err) return <p className="container py-8 text-red-300">{err}</p>
  if (!items) return <p className="container py-8">Loading…</p>

  return (
    <section className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Recommendations</h1>
      <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
        {items.map(m => (
          <article key={m.id} className="card overflow-hidden">
            <img src={m.poster} alt={m.title} className="w-full aspect-[2/3] object-cover" />
            <div className="p-3">
              <h3 className="font-semibold">{m.title}</h3>
              <p className="text-sm text-[--color-muted]">
                {m.ageRating} • {m.runtime}m • {m.genres.slice(0,2).join(' / ')}
              </p>
              {m.bestDeal && (
                <p className="mt-1 text-sm">
                  Best: {m.bestDeal.provider} · {m.bestDeal.type.toUpperCase()} ({m.bestDeal.region})
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
