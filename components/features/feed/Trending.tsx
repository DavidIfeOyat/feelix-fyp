// components/feed/Trending.tsx
"use client";

type Item = { id: string | number; title: string; poster?: string };

export default function Trending({ items = [] as Item[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Trending Now</h2>
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
        {items.length === 0 ? (
          <GhostCards />
        ) : (
          items.map((it) => <PosterCard key={it.id} title={it.title} poster={it.poster} />)
        )}
      </div>
    </section>
  );
}

function PosterCard({ title, poster }: { title: string; poster?: string }) {
  return (
    <div className="rounded-[--radius-xl] overflow-hidden border border-[--color-border] bg-[--color-surface]">
      <div className="aspect-[2/3] bg-black/30" style={poster ? { backgroundImage:`url(${poster})`, backgroundSize:"cover", backgroundPosition:"center" } : {}} />
      <div className="p-2 text-sm">{title}</div>
    </div>
  );
}

function GhostCards() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-[--radius-xl] overflow-hidden border border-[--color-border] bg-[--color-surface] animate-pulse">
          <div className="aspect-[2/3] bg-white/10" />
          <div className="p-2">
            <div className="h-3 w-3/4 bg-white/10 rounded" />
          </div>
        </div>
      ))}
    </>
  );
}
