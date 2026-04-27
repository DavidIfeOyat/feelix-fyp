"use client";

import Link from "next/link";
import { useState } from "react";

import FilmLibraryActions from "@/components/features/films/FilmLibraryActions";
import { ScheduleWatchModal } from "@/components/features/recommendations/ScheduleWatchModal";
import { useAuth } from "@/hooks/useAuth";

type FilmDetailActionBarProps = {
  tmdbId: number;
  title: string;
  poster: string | null;
  genreIds: number[];
};

export default function FilmDetailActionBar({
  tmdbId,
  title,
  poster,
  genreIds,
}: FilmDetailActionBarProps) {
  const { user, loading } = useAuth();

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  return (
    <div className="grid gap-3">
      {/* Desktop / tablet action layout */}
      <div className="hidden sm:block">
        <div className="grid gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            Library actions
          </p>

          <div className="flex flex-wrap gap-2">
            <FilmLibraryActions
              tmdbId={tmdbId}
              title={title}
              poster={poster ?? "/placeholder.svg"}
            />

            {user ? (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setScheduleOpen(true)}
                disabled={loading}
              >
                Plan to Watch
              </button>
            ) : (
              <Link
                href={`/login?from=/films/${tmdbId}`}
                className="btn btn-ghost"
              >
                Plan to Watch
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile collapsible action layout */}
      <div className="sm:hidden">
        <details className="group border-2 border-black bg-[var(--surface)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--foreground)]">
            <span>Save and track this film</span>

            <svg
              className="h-4 w-4 transition group-open:rotate-180"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.1 1.02l-4.25 4.5a.75.75 0 0 1-1.1 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
              />
            </svg>
          </summary>

          <div className="border-t-2 border-black p-4">
            <div className="grid gap-2">
              <FilmLibraryActions
                tmdbId={tmdbId}
                title={title}
                poster={poster ?? "/placeholder.svg"}
                className="grid gap-2"
              />

              {user ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setScheduleOpen(true)}
                  disabled={loading}
                >
                  Plan to Watch
                </button>
              ) : (
                <Link
                  href={`/login?from=/films/${tmdbId}`}
                  className="btn btn-ghost"
                >
                  Plan to Watch
                </Link>
              )}
            </div>
          </div>
        </details>
      </div>

      {saveMsg ? (
        <div className="border border-black bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)]">
          {saveMsg}
        </div>
      ) : null}

      {user ? (
        <ScheduleWatchModal
          open={scheduleOpen}
          userId={user.id}
          movie={{
            tmdbId,
            title,
            poster,
            genreIds,
          }}
          onClose={() => setScheduleOpen(false)}
          onSaved={(msg) => {
            setSaveMsg(msg);
            setScheduleOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}