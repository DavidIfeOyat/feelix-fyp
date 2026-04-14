"use client";

import Link from "next/link";
import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";

type Film = {
  tmdbId: number;
  title: string;
  poster: string;
  backdrop?: string | null;
};

type FilmsResponse = { items: Film[] };

const fetcher = async (url: string): Promise<FilmsResponse> => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load films");
  }
  return response.json() as Promise<FilmsResponse>;
};

function getDayKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getDayNumber(date = new Date()) {
  return Math.floor(date.getTime() / 86400000);
}

function pickDaily<T>(arr: T[], dayNumber: number) {
  if (!arr.length) return null;
  return arr[dayNumber % arr.length];
}

export default function Hero({ isAuthed }: { isAuthed: boolean }) {
  const [dayKey, setDayKey] = useState(() => getDayKey());

  const { data } = useSWR<FilmsResponse>("/api/films?list=trending&limit=20", fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 1000 * 60 * 30,
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      const nextKey = getDayKey();
      setDayKey((current) => (current === nextKey ? current : nextKey));
    }, 1000 * 60);

    return () => window.clearInterval(interval);
  }, []);

  const film = useMemo(() => {
    return pickDaily(data?.items ?? [], getDayNumber(new Date(dayKey)));
  }, [data?.items, dayKey]);

  const recHref = isAuthed ? "/recommendations" : "/login?from=/recommendations";
  const browseHref = isAuthed ? "/films" : "/login?from=/films";
  const signupHref = "/signup";

  return (
    <section className="border-2 border-black bg-[var(--surface)]">
      <div className="grid gap-0 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="border-b-2 border-black p-4 sm:p-6 lg:p-8 xl:border-b-0 xl:border-r-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
            Feelix
          </p>

          <h1 className="mt-4 max-w-5xl text-3xl font-extrabold uppercase leading-[0.92] tracking-[-0.08em] text-[var(--foreground)] sm:text-5xl lg:text-6xl">
            Find what to watch through mood and taste.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            A cleaner way to discover films, save favourites, and build a profile around your film identity.
          </p>

          <div className="mt-6 grid gap-2 min-[420px]:grid-cols-2 lg:max-w-[36rem]">
            <Link href={recHref} className="btn btn-primary text-center">
              Find a Film
            </Link>

            <Link href={browseHref} className="btn btn-ghost text-center">
              Browse Films
            </Link>

            {!isAuthed ? (
              <Link
                href={signupHref}
                className="btn btn-ghost text-center min-[420px]:col-span-2 lg:w-fit"
              >
                Create Account
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid">
          <div className="border-b-2 border-black px-4 py-3 sm:px-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
              Today’s pick
            </p>
          </div>

          <div className="p-4 sm:p-5 lg:p-6">
            {film ? (
              <div className="grid gap-4 md:grid-cols-[140px_1fr] lg:grid-cols-[160px_1fr] xl:grid-cols-[130px_1fr]">
                <div className="border-2 border-black bg-[var(--surface-strong)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={film.poster ?? "/placeholder.svg"}
                    alt={film.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <h2 className="text-2xl font-extrabold uppercase leading-[0.95] tracking-[-0.06em] text-[var(--foreground)] md:text-3xl">
                    {film.title}
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted)]">
                    A featured title from current trending films.
                  </p>

                  <div className="mt-5 grid gap-2 min-[420px]:grid-cols-2 lg:max-w-[24rem] xl:max-w-none">
                    <Link
                      href={
                        isAuthed
                          ? `/films/${film.tmdbId}`
                          : `/login?from=${encodeURIComponent(`/films/${film.tmdbId}`)}`
                      }
                      className="btn btn-primary text-center"
                    >
                      View Film
                    </Link>

                    <Link href={browseHref} className="btn btn-ghost text-center">
                      Browse More
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[var(--muted)]">Loading today’s featured title...</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}