"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type Mode = "login" | "signup";

function errMsg(err: unknown, fallback = "Something went wrong.") {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const isSignup = mode === "signup";
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const title = useMemo(
    () => (isSignup ? "Create account" : "Sign in"),
    [isSignup]
  );

  const intro = useMemo(
    () =>
      isSignup
        ? "Start building a film profile, saving titles, and shaping your collection."
        : "Return to your library, recommendations, and saved films.",
    [isSignup]
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Account created. Check your email if verification is enabled.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setMessage(errMsg(err));
    } finally {
      setLoading(false);
    }
  }

  async function sendMagicLink() {
    setMessage(null);
    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/dashboard`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) throw error;
      setMessage("Magic link sent. Check your email.");
    } catch (err) {
      setMessage(errMsg(err, "Could not send magic link."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-md border-2 border-black bg-[var(--surface)]">
      <div className="border-b-2 border-black px-5 py-4 sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
          Feelix account
        </p>
        <h1 className="mt-3 text-3xl font-extrabold uppercase leading-none tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-7 text-[var(--muted)]">
          {intro}
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-5 p-5 sm:p-6">
        <label className="grid gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            Email
          </span>
          <input
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            Password
          </span>
          <input
            type="password"
            value={password}
            autoComplete={isSignup ? "new-password" : "current-password"}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
        </label>

        <div className="grid gap-3 border-t-2 border-black pt-5">
          <button disabled={loading} type="submit" className="btn btn-primary w-full">
            {loading ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
          </button>

          <button
            disabled={loading || !email}
            type="button"
            onClick={sendMagicLink}
            className="btn btn-ghost w-full"
          >
            {loading ? "Please wait..." : "Email magic link"}
          </button>
        </div>

        {message ? (
          <div
            aria-live="polite"
            className="border border-black bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)]"
          >
            {message}
          </div>
        ) : null}

        <div className="border-t border-black pt-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--foreground)] underline-offset-4 hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New to Feelix?{" "}
              <Link href="/signup" className="text-[var(--foreground)] underline-offset-4 hover:underline">
                Create account
              </Link>
            </>
          )}
        </div>
      </form>
    </section>
  );
}