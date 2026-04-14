"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

const DEV_BYPASS_ENABLED =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DEV_BYPASS_EMAIL_CONFIRM === "1";

function friendlySignupError(message: string) {
  const m = message.toLowerCase();

  if (m.includes("user already registered")) {
    return "An account with this email already exists.";
  }

  if (m.includes("password")) {
    return "Use a stronger password with at least 8 characters.";
  }

  return "Account creation failed. Please try again.";
}

function isValidUsername(value: string) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(value);
}

export default function SignUpPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    if (!isValidUsername(cleanUsername)) {
      setErr("Username must be 3–20 characters and use only letters, numbers, or underscores.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setErr("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      if (DEV_BYPASS_ENABLED) {
        const res = await fetch("/api/dev/create-user", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            password,
            username: cleanUsername,
          }),
        });

        const json = await res.json();

        if (!res.ok || json?.ok === false) {
          throw new Error(json?.error || "Signup failed");
        }

        router.push("/login?created=1");
        return;
      }

      const emailRedirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/login?created=1`
          : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo,
          data: {
            username: cleanUsername,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        router.push("/onboarding/favourites");
        return;
      }

      router.push("/login?created=1");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Signup failed.";
      setErr(friendlySignupError(message));
    } finally {
      setLoading(false);
    }
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
          <form onSubmit={onSubmit} className="grid gap-5">
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
                disabled={loading}
                required
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
                disabled={loading}
                required
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
                  placeholder="At least 8 characters"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="border-2 border-black px-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--foreground)] transition hover:bg-black hover:text-[var(--background)] disabled:opacity-50"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <p className="text-[11px] leading-6 text-[var(--muted)]">
              Usernames can use letters, numbers, and underscores. Passwords must be at least 8 characters.
            </p>

            {err ? (
              <div className="border border-black bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)]">
                {err}
              </div>
            ) : null}

            <div className="grid gap-3 pt-2">
              <button className="btn btn-primary w-full" disabled={loading} type="submit">
                {loading ? "Creating account..." : "Create account"}
              </button>

              <Link href="/login" className="btn btn-ghost text-center">
                Sign in instead
              </Link>
            </div>

            <div className="border-t border-black pt-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
              Already have an account?{" "}
              <Link
                className="text-[var(--foreground)] underline-offset-4 hover:underline"
                href="/login"
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