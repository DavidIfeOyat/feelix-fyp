"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

function gate(userExists: boolean, href: string) {
  return userExists ? href : `/login?from=${encodeURIComponent(href)}`;
}

function desktopLinkClass() {
  return "border-b border-transparent pb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:border-black";
}

function desktopButtonClass() {
  return "inline-flex items-center justify-center border-2 border-black px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:bg-black hover:text-[var(--background)]";
}

function mobileLinkClass() {
  return "block border-2 border-black px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:bg-black hover:text-[var(--background)]";
}

export default function NavBar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthed = Boolean(user);

  const homeHref = "/";
  const filmsHref = gate(isAuthed, "/films");
  const recommendationsHref = gate(isAuthed, "/recommendations");
  const dashboardHref = gate(isAuthed, "/dashboard");
  const watchlistHref = gate(isAuthed, "/watchlist");
  const favoritesHref = gate(isAuthed, "/favorites");
  const watchedHref = gate(isAuthed, "/watched-history");
  const profileHref = gate(isAuthed, "/profile");

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  async function logout() {
    await supabase.auth.signOut();
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  }

  function closeMenu() {
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b-2 border-black bg-[var(--nav-bg)]/95 backdrop-blur-sm">
      <div className="container">
        <div className="flex min-h-[72px] items-center justify-between gap-4">
          <Link href={homeHref} className="shrink-0 text-[var(--foreground)]" onClick={closeMenu}>
            <span className="block text-[10px] font-bold uppercase tracking-[0.28em]">
              Feelix
            </span>
            <span className="block text-[1.45rem] font-extrabold uppercase leading-none tracking-[-0.08em] sm:text-[1.6rem]">
              FilmLibrary
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-between gap-8 lg:flex">
            <nav className="flex min-w-0 items-center gap-5 xl:gap-7">
              <Link href={homeHref} className={desktopLinkClass()}>
                Home
              </Link>
              <Link href={filmsHref} className={desktopLinkClass()}>
                Films
              </Link>
              <Link href={recommendationsHref} className={desktopLinkClass()}>
                Recommendations
              </Link>

              {isAuthed ? (
                <>
                  <Link href={dashboardHref} className={desktopLinkClass()}>
                    Dashboard
                  </Link>
                  <Link href={watchlistHref} className={desktopLinkClass()}>
                    Watchlist
                  </Link>
                  <Link href={favoritesHref} className={desktopLinkClass()}>
                    Favourites
                  </Link>
                  <Link href={profileHref} className={desktopLinkClass()}>
                    Profile
                  </Link>
                </>
              ) : null}
            </nav>

            {!user ? (
              <div className="flex items-center gap-3">
                <Link href="/login" className={desktopLinkClass()}>
                  Sign In
                </Link>
                <Link href="/signup" className={desktopButtonClass()}>
                  Create Account
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href={watchedHref} className={desktopLinkClass()}>
                  History
                </Link>
                <button type="button" className={desktopButtonClass()} onClick={logout}>
                  Sign Out
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center border-2 border-black bg-[var(--surface)] text-[var(--foreground)] transition hover:bg-black hover:text-[var(--background)] lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {!mobileOpen ? (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
                strokeLinejoin="miter"
                aria-hidden="true"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
                strokeLinejoin="miter"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 top-[72px] z-40 bg-black/10 lg:hidden"
            onClick={closeMenu}
            aria-label="Close menu backdrop"
          />

          <div className="fixed inset-x-0 top-[72px] z-50 px-3 pb-3 lg:hidden">
            <div className="mx-auto w-full max-w-[780px] border-2 border-black bg-[var(--background)] shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
              <div className="grid gap-5 p-4 sm:p-5">
                <div className="grid gap-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                    Explore
                  </p>
                  <Link href={homeHref} className={mobileLinkClass()} onClick={closeMenu}>
                    Home
                  </Link>
                  <Link href={filmsHref} className={mobileLinkClass()} onClick={closeMenu}>
                    Films
                  </Link>
                  <Link
                    href={recommendationsHref}
                    className={mobileLinkClass()}
                    onClick={closeMenu}
                  >
                    Recommendations
                  </Link>
                </div>

                {isAuthed ? (
                  <>
                    <div className="grid gap-2">
                      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                        Library
                      </p>
                      <Link href={dashboardHref} className={mobileLinkClass()} onClick={closeMenu}>
                        Dashboard
                      </Link>
                      <Link href={watchlistHref} className={mobileLinkClass()} onClick={closeMenu}>
                        Watchlist
                      </Link>
                      <Link href={favoritesHref} className={mobileLinkClass()} onClick={closeMenu}>
                        Favourites
                      </Link>
                      <Link href={watchedHref} className={mobileLinkClass()} onClick={closeMenu}>
                        Watched History
                      </Link>
                      <Link href={profileHref} className={mobileLinkClass()} onClick={closeMenu}>
                        Profile
                      </Link>
                    </div>

                    <div className="grid gap-2">
                      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                        Account
                      </p>
                      <button
                        type="button"
                        className={`${mobileLinkClass()} w-full text-left`}
                        onClick={logout}
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="grid gap-2">
                    <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                      Account
                    </p>
                    <Link href="/login" className={mobileLinkClass()} onClick={closeMenu}>
                      Sign In
                    </Link>
                    <Link href="/signup" className={mobileLinkClass()} onClick={closeMenu}>
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}