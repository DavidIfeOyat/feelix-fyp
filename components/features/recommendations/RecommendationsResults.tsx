"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import type { RecoItem } from "@/hooks/useRecommendationBuilder";

export type RecommendationsResultsProps = {
  summary: string;
  items: RecoItem[];
  busy: boolean;
  onChangeMood: () => void;
  onTryAnother: () => void;
  addToWatchlist: (item: RecoItem) => Promise<void>;
  openSchedule: (item: RecoItem) => void;
};

function InfoPill({ children }: { children: ReactNode }) {
  return (
    <span className="border border-black px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--foreground)]">
      {children}
    </span>
  );
}

export function RecommendationsResults({
  items,
  busy,
  onChangeMood,
  onTryAnother,
  addToWatchlist,
  openSchedule,
}: RecommendationsResultsProps) {
  const [addedIds, setAddedIds] = useState<number[]>([]);
  const [savingIds, setSavingIds] = useState<number[]>([]);

  const heroItem = items[0] ?? null;
  const supportingItems = items.slice(1, 4);

  async function handleAddToWatchlist(item: RecoItem) {
    if (addedIds.includes(item.tmdbId) || savingIds.includes(item.tmdbId)) return;

    setSavingIds((prev) => [...prev, item.tmdbId]);

    try {
      await addToWatchlist(item);
      setAddedIds((prev) => (prev.includes(item.tmdbId) ? prev : [...prev, item.tmdbId]));
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
    } finally {
      setSavingIds((prev) => prev.filter((id) => id !== item.tmdbId));
    }
  }

  function getWatchlistLabel(item: RecoItem) {
    if (addedIds.includes(item.tmdbId)) return "Added";
    if (savingIds.includes(item.tmdbId)) return "Adding...";
    return "Add to Watchlist";
  }

  function isWatchlistDisabled(item: RecoItem) {
    return addedIds.includes(item.tmdbId) || savingIds.includes(item.tmdbId);
  }

  return (
    <div className="mt-8 grid gap-6">
      {items.length === 0 ? (
        <section className="border-2 border-black bg-[var(--surface)]">
          <div className="p-5 text-center sm:p-6">
            <p className="text-xl font-extrabold uppercase leading-none tracking-[-0.05em] text-[var(--foreground)]">
              No matches found
            </p>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Try lowering the minimum rating, removing streaming filters, changing the mood mix,
              or using surprise mode.
            </p>

            <div className="mt-5 grid gap-2 min-[420px]:grid-cols-2 sm:mx-auto sm:max-w-md">
              <button className="btn btn-ghost" onClick={onChangeMood} type="button">
                Adjust Filters
              </button>

              <button
                className="btn btn-primary"
                onClick={onTryAnother}
                disabled={busy}
                type="button"
              >
                Try Another
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {heroItem ? (
        <>
          <section className="border-2 border-black bg-[var(--surface)]">
            <div className="grid gap-4 border-b-2 border-black px-4 py-4 sm:px-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                  Results
                </p>

                <h2 className="mt-2 text-2xl font-extrabold uppercase leading-[0.95] tracking-[-0.05em] text-[var(--foreground)] sm:text-3xl">
                  Your best match
                </h2>

                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Showing 1 strongest recommendation and {supportingItems.length} close
                  alternative{supportingItems.length === 1 ? "" : "s"}.
                </p>
              </div>

              <div className="grid gap-2 min-[420px]:grid-cols-2 lg:w-[320px]">
                <button
                  className="btn btn-ghost"
                  onClick={onChangeMood}
                  disabled={busy}
                  type="button"
                >
                  Change Mood
                </button>

                <button
                  className="btn btn-primary"
                  onClick={onTryAnother}
                  disabled={busy}
                  type="button"
                >
                  {busy ? "Finding..." : "Try Another Set"}
                </button>
              </div>
            </div>

            <div className="grid gap-0 xl:grid-cols-[240px_1fr]">
              <div className="border-b-2 border-black bg-[var(--surface-strong)] p-4 sm:p-5 xl:border-b-0 xl:border-r-2">
                <div className="mx-auto max-w-[260px] overflow-hidden border-2 border-black bg-[var(--surface)] xl:max-w-none">
                  <img
                    src={heroItem.poster ?? "/placeholder.svg"}
                    alt={heroItem.title}
                    className="aspect-[2/3] w-full object-cover"
                  />
                </div>
              </div>

              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex flex-wrap gap-2">
                  <InfoPill>Best Match</InfoPill>
                  <InfoPill>{Math.round(heroItem.match * 100)}% Match</InfoPill>
                  {heroItem.bestDeal?.provider ? (
                    <InfoPill>
                      {heroItem.bestDeal.type.toUpperCase()} • {heroItem.bestDeal.provider}
                    </InfoPill>
                  ) : null}
                </div>

                <h3 className="mt-4 break-words text-2xl font-extrabold uppercase leading-[0.92] tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
                  {heroItem.title}
                </h3>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--foreground)] sm:text-base">
                  This is your strongest overall recommendation based on your mood profile,
                  viewing context, filters, and saved taste signals.
                </p>

                <div className="mt-5 grid gap-2 border-t-2 border-black pt-4 min-[420px]:grid-cols-2 2xl:grid-cols-3">
                  <Link className="btn btn-ghost text-center" href={`/films/${heroItem.tmdbId}`}>
                    Open Details
                  </Link>

                  <button
                    className="btn btn-primary"
                    onClick={() => handleAddToWatchlist(heroItem)}
                    disabled={isWatchlistDisabled(heroItem)}
                    type="button"
                  >
                    {getWatchlistLabel(heroItem)}
                  </button>

                  <button
                    className="btn btn-ghost"
                    onClick={() => openSchedule(heroItem)}
                    type="button"
                  >
                    Schedule Watch
                  </button>
                </div>
              </div>
            </div>
          </section>

          {supportingItems.length > 0 ? (
            <section className="border-2 border-black bg-[var(--surface)]">
              <div className="border-b-2 border-black px-4 py-4 sm:px-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                  Alternatives
                </p>
                <h3 className="mt-2 text-2xl font-extrabold uppercase leading-[0.95] tracking-[-0.05em] text-[var(--foreground)] sm:text-3xl">
                  Other close matches
                </h3>
              </div>

              <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 2xl:grid-cols-3">
                {supportingItems.map((it) => (
                  <article
                    key={`rec-${it.tmdbId}`}
                    className="overflow-hidden border-2 border-black bg-[var(--surface-strong)]"
                  >
                    <div className="bg-[var(--surface)]">
                      <img
                        src={it.poster ?? "/placeholder.svg"}
                        alt={it.title}
                        className="aspect-[2/3] w-full object-cover"
                      />
                    </div>

                    <div className="border-t-2 border-black p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h4 className="min-w-0 flex-1 break-words text-lg font-extrabold uppercase leading-[0.95] tracking-[-0.05em] text-[var(--foreground)]">
                          {it.title}
                        </h4>
                        <InfoPill>{Math.round(it.match * 100)}%</InfoPill>
                      </div>

                      <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
                        {it.bestDeal?.provider
                          ? `${it.bestDeal.type.toUpperCase()} • ${it.bestDeal.provider}`
                          : "Providers unavailable"}
                      </p>

                      <div className="mt-4 grid gap-2">
                        <Link className="btn btn-ghost text-center" href={`/films/${it.tmdbId}`}>
                          Open Details
                        </Link>

                        <button
                          className="btn btn-primary"
                          onClick={() => handleAddToWatchlist(it)}
                          disabled={isWatchlistDisabled(it)}
                          type="button"
                        >
                          {getWatchlistLabel(it)}
                        </button>

                        <button
                          className="btn btn-ghost"
                          onClick={() => openSchedule(it)}
                          type="button"
                        >
                          Schedule Watch
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}