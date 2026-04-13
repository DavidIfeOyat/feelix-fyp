"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type AuthMsg = { type: "error" | "success"; text: string } | null;

function friendlyAuthError(message: string) {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }

  if (m.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  if (m.includes("too many requests")) {
    return "Too many attempts. Try again in a minute.";
  }

  return "Sign in failed. Please try again.";
}

function resolveRedirect(rawFrom: string | null) {
  const fallback = "/dashboard";

  if (!rawFrom) return fallback;

  if (!rawFrom.startsWith("/") || rawFrom.startsWith("//")) {
    return fallback;
  }

  if (rawFrom.startsWith("/login") || rawFrom.startsWith("/signup")) {
    return fallback;
  }

  return rawFrom;
}

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const from = useMemo(() => resolveRedirect(searchParams.get("from")), [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<AuthMsg>(() => {
    if (searchParams.get("created") === "1") {
      return { type: "success", text: "Account created. You can sign in now." };
    }
    return null;
  });

  useEffect(() => {
    if (!loading && user) {
      router.replace(from);
      router.refresh();
    }
  }, [loading, user, from, router]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setMsg({ type: "error", text: "Enter both your email and password." });
      setBusy(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;

      router.replace(from);
      router.refresh();
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "Login failed.";
      setMsg({ type: "error", text: friendlyAuthError(raw) });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="container py-10 sm:py-14">
        <div className="mx-auto max-w-5xl border-2 border-black bg-[var(--surface)]">
          <div className="border-b-2 border-black px-5 py-4 sm:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
              Feelix access
            </p>
            <h1 className="mt-3 text-3xl font-extrabold uppercase leading-none tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
              Loading
            </h1>
          </div>

          <div className="p-5 text-sm text-[var(--muted)] sm:p-6">
            Checking your session...
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-10 sm:py-14">
      <div className="mx-auto max-w-5xl border-2 border-black bg-[var(--surface)]">
        <div className="grid md:grid-cols-[0.95fr_1.05fr]">
          <div className="border-b-2 border-black p-5 sm:p-6 md:border-b-0 md:border-r-2 md:p-8">
            <Link
              href="/"
              className="inline-block text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--foreground)]"
            >
              Feelix / Film Library
            </Link>

            <div className="mt-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                Sign in
              </p>

              <h1 className="mt-4 text-4xl font-extrabold uppercase leading-[0.92] tracking-[-0.08em] text-[var(--foreground)] sm:text-5xl">
                Return to your collection.
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-[var(--muted)] sm:text-base">
                Continue to your recommendations, saved films, watchlist, and personal profile.
              </p>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              <div className="border border-black px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  01
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[-0.03em] text-[var(--foreground)]">
                  Mood-led picks
                </p>
              </div>

              <div className="border border-black px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  02
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[-0.03em] text-[var(--foreground)]">
                  Saved watchlist
                </p>
              </div>

              <div className="border border-black px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  03
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[-0.03em] text-[var(--foreground)]">
                  Social profiles
                </p>
              </div>
            </div>

            <div className="mt-10 border-t-2 border-black pt-5">
              <Link
                href="/"
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--foreground)] underline-offset-4 hover:underline"
              >
                Back to home
              </Link>
            </div>
          </div>

          <div className="p-5 sm:p-6 md:p-8">
            <div className="border-b-2 border-black pb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                Member access
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Sign in with your email and password to continue where you left off.
              </p>
            </div>

            <form onSubmit={onLogin} className="grid gap-5 pt-5">
              <label className="grid gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Email
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  className="w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@uni.ac.uk"
                  required
                  disabled={busy}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Password
                </span>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    className="w-full"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    disabled={busy}
                  />

                  <button
                    type="button"
                    className="border-2 border-black px-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:bg-black hover:text-[var(--background)] disabled:opacity-50"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    disabled={busy}
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              {msg ? (
                <div className="border border-black bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)]">
                  {msg.text}
                </div>
              ) : null}

              <div className="grid gap-3 border-t-2 border-black pt-5">
                <button className="btn btn-primary w-full" disabled={busy} type="submit">
                  {busy ? "Signing in..." : "Sign in"}
                </button>

                <Link href="/signup" className="btn btn-ghost text-center">
                  Create account
                </Link>
              </div>

              <div className="border-t border-black pt-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                Don’t have an account?{" "}
                <Link
                  className="text-[var(--foreground)] underline-offset-4 hover:underline"
                  href="/signup"
                >
                  Create one
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}