"use client";

import Link from "next/link";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-black bg-[var(--surface)] px-4 py-4">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] sm:text-[10px]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold uppercase leading-none tracking-[-0.05em] text-[var(--foreground)] md:text-3xl">
        {value}
      </p>
    </div>
  );
}

function StatButton(props: {
  label: string;
  value: string;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      className="border-2 border-black bg-[var(--surface)] px-4 py-4 text-left transition hover:bg-black hover:text-[var(--background)]"
      onClick={props.onClick}
      title={props.title}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] opacity-70 sm:text-[10px]">
        {props.label}
      </p>
      <p className="mt-2 text-2xl font-extrabold uppercase leading-none tracking-[-0.05em] md:text-3xl">
        {props.value}
      </p>
    </button>
  );
}

export function ProfileHero(props: {
  heroBackdrop: string | null;
  avatarUrl: string | null;
  resolvedName: string;
  resolvedUsername: string;
  resolvedBio: string;
  counts: {
    followers: number;
    following: number;
    filmsWatched: number;
    watchlistCount: number;
  };
  hubError?: string | null;
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
  onOpenSettings: () => void;
}) {
  const { heroBackdrop, avatarUrl, resolvedName, resolvedUsername, resolvedBio, counts } = props;

  return (
    <section className="overflow-hidden border-2 border-black bg-[var(--surface)]">
      <div className="hidden border-b-2 border-black md:grid md:grid-cols-3">
        <div className="border-r-2 border-black px-4 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
          Personal collection
        </div>
        <div className="border-r-2 border-black px-4 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
          Public profile
        </div>
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
          Taste identity
        </div>
      </div>

      {heroBackdrop ? (
        <div className="hidden border-b-2 border-black bg-[var(--surface-strong)] md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroBackdrop}
            alt=""
            className="h-[140px] w-full object-cover lg:h-[180px]"
          />
        </div>
      ) : null}

      <div className="grid gap-0 xl:grid-cols-[1fr_0.92fr]">
        <div className="border-b-2 border-black p-4 sm:p-6 lg:p-8 xl:border-b-0 xl:border-r-2">
          <div className="grid grid-cols-[72px_1fr] gap-4 md:grid-cols-[88px_1fr] md:gap-5">
            <div className="h-[72px] w-[72px] border-2 border-black bg-[var(--surface-strong)] md:h-[88px] md:w-[88px]">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-2xl font-extrabold uppercase tracking-[-0.06em] text-[var(--foreground)] md:text-3xl">
                  {resolvedName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)] sm:text-[10px]">
                Member profile
              </p>

              <h1 className="mt-2 break-all text-[1.8rem] font-extrabold uppercase leading-[0.92] tracking-[-0.07em] text-[var(--foreground)] sm:break-words sm:text-4xl md:mt-3 md:text-5xl">
                {resolvedName}
              </h1>

              <p className="mt-2 break-all text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] sm:text-[11px]">
                @{resolvedUsername}
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-2xl break-words text-sm leading-7 text-[var(--foreground)] md:mt-5 md:text-base">
            {resolvedBio}
          </p>

          <div className="mt-5 border-t-2 border-black pt-4 md:mt-7">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
              Actions
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-4">
              <Link href="/watchlist" className="btn btn-primary text-center">
                Watchlist
              </Link>

              <Link href="/favorites" className="btn btn-ghost text-center">
                Favourites
              </Link>

              <Link href="/films" className="btn btn-ghost text-center">
                Browse
              </Link>

              <button
                type="button"
                className="btn btn-ghost text-center"
                onClick={props.onOpenSettings}
                title="Settings"
              >
                Settings
              </button>
            </div>
          </div>

          {props.hubError ? (
            <div className="mt-4 border border-black bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] md:mt-5">
              {props.hubError}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 p-4 sm:p-6 lg:p-8">
          <div className="border-b-2 border-black pb-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
              Profile stats
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Social activity and library progress at a glance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
            <StatButton
              label="Followers"
              value={String(counts.followers)}
              onClick={props.onOpenFollowers}
              title="View followers"
            />

            <StatButton
              label="Following"
              value={String(counts.following)}
              onClick={props.onOpenFollowing}
              title="View following"
            />

            <StatCard label="Films Watched" value={String(counts.filmsWatched)} />
            <StatCard label="Watchlist" value={String(counts.watchlistCount)} />
          </div>
        </div>
      </div>
    </section>
  );
}