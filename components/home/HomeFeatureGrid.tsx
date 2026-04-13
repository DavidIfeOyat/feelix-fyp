"use client";

import Link from "next/link";

type FeatureCard = {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  number: string;
};

export default function HomeFeatureGrid({ isAuthed }: { isAuthed: boolean }) {
  const gate = (path: string) => (isAuthed ? path : `/login?from=${encodeURIComponent(path)}`);

  const cards: FeatureCard[] = [
    {
      number: "01",
      eyebrow: "Discover faster",
      title: "Mood-led recommendations",
      body: "Find films based on how you want the evening to feel, rather than scrolling through the same generic lists.",
      href: gate("/recommendations"),
      cta: "Open recommendations",
    },
    {
      number: "02",
      eyebrow: "Stay organised",
      title: "Watchlist and reminders",
      body: "Keep your next watches visible, save titles that matter, and build a more intentional viewing habit.",
      href: gate("/watchlist"),
      cta: "Open watchlist",
    },
    {
      number: "03",
      eyebrow: "Show your taste",
      title: "Profiles with personality",
      body: "Shape a film identity through favourites, personal profile details, and a visible Mount Rushmore of films.",
      href: gate("/profile"),
      cta: "View profile",
    },
    {
      number: "04",
      eyebrow: "Social discovery",
      title: "Find people through taste",
      body: "Browse other members and discover films through overlapping interests, favourites, and visible profile choices.",
      href: gate("/people"),
      cta: "Find people",
    },
  ];

  return (
    <section className="border-t-2 border-black pt-6 sm:pt-8">
      <div className="border-b-2 border-black pb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
          What Feelix is built for
        </p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <h2 className="max-w-4xl text-3xl font-extrabold uppercase leading-[0.92] tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl md:text-5xl">
            Film discovery that feels curated, organised, and personal.
          </h2>

          <p className="max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            Feelix works best when recommendations, saved films, and your personal taste all
            sit together in one cleaner collection space.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.title}
            className="grid min-h-[260px] border-2 border-black bg-[var(--surface)]"
          >
            <div className="border-b border-black px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                {card.number}
              </p>
            </div>

            <div className="grid gap-4 p-4 sm:p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                  {card.eyebrow}
                </p>

                <h3 className="mt-3 text-2xl font-extrabold uppercase leading-[0.95] tracking-[-0.05em] text-[var(--foreground)]">
                  {card.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-[var(--muted)] sm:text-base">
                  {card.body}
                </p>
              </div>

              <div className="mt-auto border-t border-black pt-4">
                <Link
                  href={card.href}
                  className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--foreground)] underline-offset-4 transition hover:underline"
                >
                  {card.cta}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}