"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type AuthMsg = { type: "error" | "success"; text: string } | null;

type SignupPageClientProps = {
  from: string;
};

function friendlySignupError(message: string) {
  const m = message.toLowerCase();

  if (m.includes("user already registered")) {
    return "An account with that email already exists.";
  }

  if (m.includes("password")) {
    return "Please choose a stronger password.";
  }

  if (m.includes("too many requests")) {
    return "Too many attempts. Try again in a minute.";
  }

  return "Sign up failed. Please try again.";
}

function isValidUsername(value: string) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(value);
}

export default function SignupPageClient({ from }: SignupPageClientProps) {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<AuthMsg>(null);

  useEffect(() => {
    if (!loading && user) {
      window.location.replace(from);
    }
  }, [loading, user, from]);

  async function onSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername || !cleanEmail || !password || !confirmPassword) {
      setMsg({ type: "error", text: "Complete all fields." });
      setBusy(false);
      return;
    }

    if (!isValidUsername(cleanUsername)) {
      setMsg({
        type: "error",
        text: "Username must be 3–20 characters and use only letters, numbers, or underscores.",
      });
      setBusy(false);
      return;
    }

    if (password !== confirmPassword) {
      setMsg({ type: "error", text: "Passwords do not match." });
      setBusy(false);
      return;
    }

    if (password.length < 8) {
      setMsg({ type: "error", text: "Password must be at least 8 characters." });
      setBusy(false);
      return;
    }

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/login?created=1&from=${encodeURIComponent(from)}`;

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            username: cleanUsername,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        window.location.assign(from);
        return;
      }

      setMsg({
        type: "success",
        text: "Account created. Check your email to confirm, then sign in.",
      });

      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "Sign up failed.";
      setMsg({ type: "error", text: friendlySignupError(raw) });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="container py-10 sm:py-14">
        <div className="mx-auto max-w-md border-2 border-black bg-[var(--surface)]">
          <div className="px-5 py-6 text-sm text-[var(--muted)]">Loading...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-10 sm:py-14">
      <div className="mx-auto max-w-md border-2 border-black bg-[var(--surface)]">
        <div className="border-b-2 border-black px-5 py-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            Feelix
          </p>
          <h1 className="mt-3 text-3xl font-extrabold uppercase leading-none tracking-[-0.06em] text-[var(--foreground)]">
            Create Account
          </h1>
        </div>

        <div className="p-5 sm:p-6">
          <form onSubmit={onSignup} className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                Username
              </span>
              <input
                type="text"
                autoComplete="username"
                className="w-full"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                required
                disabled={busy}
              />
            </label>

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
                  autoComplete="new-password"
                  className="w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
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

            <label className="grid gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                Confirm Password
              </span>

              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  autoComplete="new-password"
                  className="w-full"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                  disabled={busy}
                />

                <button
                  type="button"
                  className="border-2 border-black px-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:bg-black hover:text-[var(--background)] disabled:opacity-50"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  aria-label={showConfirmPw ? "Hide password" : "Show password"}
                  disabled={busy}
                >
                  {showConfirmPw ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <p className="text-[11px] leading-6 text-[var(--muted)]">
              Usernames can use letters, numbers, and underscores. Passwords must be at least 8 characters.
            </p>

            {msg ? (
              <div className="border border-black bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)]">
                {msg.text}
              </div>
            ) : null}

            <div className="grid gap-3 pt-2">
              <button className="btn btn-primary w-full" disabled={busy} type="submit">
                {busy ? "Creating account..." : "Create account"}
              </button>

              <Link
                href={`/login?from=${encodeURIComponent(from)}`}
                className="btn btn-ghost text-center"
              >
                Sign in instead
              </Link>
            </div>

            <div className="border-t border-black pt-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
              Already have an account?{" "}
              <Link
                className="text-[var(--foreground)] underline-offset-4 hover:underline"
                href={`/login?from=${encodeURIComponent(from)}`}
              >
                Sign in
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