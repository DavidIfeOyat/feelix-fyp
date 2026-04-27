"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type AuthMsg = { type: "error" | "success"; text: string } | null;

type LoginPageClientProps = {
  from: string;
  created: boolean;
};

/**
 * Maps Supabase/auth provider errors into short, user-facing messages.
 * The goal here is to keep login feedback clear without exposing raw backend wording.
 */
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

export default function LoginPageClient({
  from,
  created,
}: LoginPageClientProps) {
  const { user, loading } = useAuth();

  // Keep the Supabase browser client stable for the lifetime of the component.
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  // If the user has just come from sign-up, show a lightweight success prompt.
  const [msg, setMsg] = useState<AuthMsg>(
    created
      ? { type: "success", text: "Account created. You can sign in now." }
      : null
  );

  /**
   * If an authenticated user reaches this page, send them back to the intended route.
   * This avoids leaving signed-in users stranded on the login screen.
   */
  useEffect(() => {
    if (!loading && user) {
      window.location.replace(from);
    }
  }, [loading, user, from]);

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setBusy(true);
    setMsg(null);

    // Normalise the email before sending it to auth.
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setMsg({
        type: "error",
        text: "Enter both your email and password.",
      });
      setBusy(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;

      // Use a hard navigation so auth/session state is fully refreshed after sign-in.
      window.location.assign(from);
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "Login failed.";

      setMsg({
        type: "error",
        text: friendlyAuthError(raw),
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="container py-10 sm:py-14">
        <div className="mx-auto max-w-md border-2 border-black bg-[var(--surface)]">
          <div className="px-5 py-6 text-sm text-[var(--muted)]">
            Loading...
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-10 sm:py-14">
      <div className="mx-auto max-w-md border-2 border-black bg-[var(--surface)]">
        {/* Header */}
        <div className="border-b-2 border-black px-5 py-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            Feelix
          </p>

          <h1 className="mt-3 text-3xl font-extrabold uppercase leading-none tracking-[-0.06em] text-[var(--foreground)]">
            Sign In
          </h1>
        </div>

        {/* Form content */}
        <div className="p-5 sm:p-6">
          <form onSubmit={onLogin} className="grid gap-5">
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
                placeholder="you@example.com"
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

            <div className="grid gap-3 pt-2">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={busy}
              >
                {busy ? "Signing in..." : "Sign in"}
              </button>

              <Link
                href={`/signup?from=${encodeURIComponent(from)}`}
                className="btn btn-ghost text-center"
              >
                Create account
              </Link>
            </div>

            <div className="border-t border-black pt-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
              Don’t have an account?{" "}
              <Link
                href={`/signup?from=${encodeURIComponent(from)}`}
                className="text-[var(--foreground)] underline-offset-4 hover:underline"
              >
                Create one
              </Link>
            </div>

            <div className="text-center">
              <Link
                href="/"
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--foreground)] underline-offset-4 hover:underline"
              >
                Back to home
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}