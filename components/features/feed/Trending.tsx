"use client";

type Item = {
  id: string | number;
  title: string;
  poster?: string;
};

type TrendingProps = {
  items?: Item[];
};

export default function Trending({ items = [] as Item[] }: TrendingProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Trending Now</h2>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
        {items.length === 0 ? (
          <GhostCards />
        ) : (
          items.map((item) => (
            <PosterCard
              key={item.id}
              title={item.title}
              poster={item.poster}
            />
          ))
        )}
      </div>
    </section>
  );
}

function PosterCard({
  title,
  poster,
}: {
  title: string;
  poster?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[--radius-xl] border border-[--color-border] bg-[--color-surface]">
      <div
        className="aspect-[2/3] bg-black/30"
        style={
          poster
            ? {
                backgroundImage: `url(${poster})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {}
        }
      />

      <div className="p-2 text-sm">{title}</div>
    </div>
  );
}

function GhostCards() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-[--radius-xl] border border-[--color-border] bg-[--color-surface]"
        >
          <div className="aspect-[2/3] bg-white/10" />

          <div className="p-2">
            <div className="h-3 w-3/4 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </>
  );
}