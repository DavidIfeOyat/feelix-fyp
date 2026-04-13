"use client";

import Link from "next/link";

export default function HomeFinalCTA({ isAuthed }: { isAuthed: boolean }) {
  const primaryHref = isAuthed ? "/recommendations" : "/signup";
  const secondaryHref = isAuthed ? "/profile" : "/login";

  return (
    <section className="border-t-2 border-black pt-6 sm:pt-8">
      <div className="border-2 border-black bg-[var(--surface)]">
        <div className="grid border-b-2 border-black sm:grid-cols-3">
          <div className="border-b border-black px-4 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:border-b-0 sm:border-r-2">
            Personal discovery
          </div>
          <div className="border-b border-black px-4 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:border-b-0 sm:border-r-2">
            Saved collections
          </div>
          <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            Social taste
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[1.15fr_0.85fr] md:items-end md:p-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
              Ready to use Feelix properly?
            </p>

            <h2 className="mt-4 max-w-4xl text-3xl font-extrabold uppercase leading-[0.92] tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl md:text-5xl">
              Turn film discovery into something more deliberate.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              Build a stronger taste profile, keep your next watches organised, and make the
              whole experience feel more like a personal collection than a crowded feed.
            </p>
          </div>

          <div className="grid gap-3 md:justify-self-end">
            <Link href={primaryHref} className="btn btn-primary text-center">
              {isAuthed ? "Get recommendations" : "Create account"}
            </Link>

            <Link href={secondaryHref} className="btn btn-ghost text-center">
              {isAuthed ? "Go to profile" : "Sign in"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}