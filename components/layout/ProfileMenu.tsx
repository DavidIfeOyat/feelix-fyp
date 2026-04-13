"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/actions/auth";

type ProfileMenuProps = {
  profileHref?: string;
  watchlistHref?: string;
  favoritesHref?: string;
  watchedHref?: string;
};

export default function ProfileMenu({
  profileHref,
  watchlistHref,
  favoritesHref,
  watchedHref,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Fallbacks prevent runtime crashes if a prop is missing.
  const safeProfileHref = profileHref ?? "/profile";
  const safeWatchlistHref = watchlistHref ?? "/watchlist";
  const safeFavoritesHref = favoritesHref ?? "/favorites";
  const safeWatchedHref = watchedHref ?? "/watched-history";

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const itemClass =
    "block px-3 py-2 text-sm no-underline transition hover:bg-white/10";

  return (
    <div ref={rootRef} className="relative">
      {/* Account trigger */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
        aria-label="Open account menu"
        aria-expanded={open}
      >
        <span className="inline-grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/10 text-xs">
          👤
        </span>
        <span>Account</span>
        <svg
          className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.1 1.02l-4.25 4.5a.75.75 0 0 1-1.1 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-black/90 shadow-lg backdrop-blur"
          role="menu"
        >
          <div className="border-b border-white/10 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Account
            </p>
          </div>

          <Link
            href={safeProfileHref}
            className={itemClass}
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            Profile
          </Link>

          <div className="h-px bg-white/10" />

          <Link
            href={safeWatchlistHref}
            className={itemClass}
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            Watchlist
          </Link>

          <Link
            href={safeFavoritesHref}
            className={itemClass}
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            Favorites
          </Link>

          <Link
            href={safeWatchedHref}
            className={itemClass}
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            Watched History
          </Link>

          <div className="h-px bg-white/10" />

          {/* Existing sign-out server action */}
          <form
            action={async () => {
              setOpen(false);
              await signOutAction();
            }}
          >
            <button
              type="submit"
              className="w-full px-3 py-2 text-left text-sm transition hover:bg-white/10"
              role="menuitem"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}