"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function DashboardPage() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;

      const userEmail = data.user?.email ?? null;
      setEmail(userEmail);
      setLoading(false);

      if (!userEmail) {
        window.location.href = "/login";
      }
    });

    return () => {
      alive = false;
    };
  }, [supabase]);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <section className="container py-8 sm:py-10">
        <div className="border-2 border-black bg-[var(--surface)]">
          <div className="border-b-2 border-black px-4 py-4 sm:px-6">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
              Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-extrabold uppercase leading-none tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
              Loading
            </h1>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-8 sm:py-10">
      <div className="grid gap-6">
        <section className="border-2 border-black bg-[var(--surface)]">
          <div className="grid border-b-2 border-black sm:grid-cols-3">
            <div className="border-b border-black px-4 py-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:border-b-0 sm:border-r-2 sm:text-[10px]">
              Member dashboard
            </div>
            <div className="border-b border-black px-4 py-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:border-b-0 sm:border-r-2 sm:text-[10px]">
              Library access
            </div>
            <div className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
              Account overview
            </div>
          </div>

          <div className="grid gap-6 p-4 sm:p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                Signed in
              </p>

              <h1 className="mt-4 text-3xl font-extrabold uppercase leading-[0.92] tracking-[-0.08em] text-[var(--foreground)] sm:text-5xl">
                Your film space.
              </h1>

              <p className="mt-4 break-all text-sm leading-7 text-[var(--muted)] sm:text-base">
                Signed in as <span className="font-bold text-[var(--foreground)]">{email}</span>
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--foreground)] sm:text-base">
                Use the dashboard as a quick route into your watchlist, favourites, profile, and recommendations.
              </p>
            </div>

            <div className="grid gap-3 min-[420px]:grid-cols-2 md:grid-cols-1">
              <Link href="/watchlist" className="btn btn-primary text-center">
                Go to Watchlist
              </Link>

              <Link href="/favorites" className="btn btn-ghost text-center">
                View Favourites
              </Link>

              <Link href="/profile" className="btn btn-ghost text-center">
                Open Profile
              </Link>

              <Link href="/recommendations" className="btn btn-ghost text-center">
                Get Recommendations
              </Link>

              <button onClick={logout} className="btn btn-ghost text-center md:col-span-1" type="button">
                Sign Out
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
          <div className="border-2 border-black bg-[var(--surface)] px-4 py-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] sm:text-[10px]">
              Route
            </p>
            <p className="mt-2 text-xl font-extrabold uppercase leading-none tracking-[-0.05em] text-[var(--foreground)]">
              Watchlist
            </p>
          </div>

          <div className="border-2 border-black bg-[var(--surface)] px-4 py-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] sm:text-[10px]">
              Route
            </p>
            <p className="mt-2 text-xl font-extrabold uppercase leading-none tracking-[-0.05em] text-[var(--foreground)]">
              Profile
            </p>
          </div>

          <div className="border-2 border-black bg-[var(--surface)] px-4 py-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] sm:text-[10px]">
              Route
            </p>
            <p className="mt-2 text-xl font-extrabold uppercase leading-none tracking-[-0.05em] text-[var(--foreground)]">
              Favourites
            </p>
          </div>

          <div className="border-2 border-black bg-[var(--surface)] px-4 py-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] sm:text-[10px]">
              Route
            </p>
            <p className="mt-2 text-xl font-extrabold uppercase leading-none tracking-[-0.05em] text-[var(--foreground)]">
              Recommendations
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}