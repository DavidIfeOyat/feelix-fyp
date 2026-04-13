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
                Create account
              </p>

              <h1 className="mt-4 text-4xl font-extrabold uppercase leading-[0.92] tracking-[-0.08em] text-[var(--foreground)] sm:text-5xl">
                Start your collection.
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-[var(--muted)] sm:text-base">
                Build a personal film space with recommendations, saved lists, favourites,
                and a visible profile shaped around your taste.
              </p>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              <div className="border border-black px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  01
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[-0.03em] text-[var(--foreground)]">
                  Save films
                </p>
              </div>

              <div className="border border-black px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  02
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[-0.03em] text-[var(--foreground)]">
                  Get recommendations
                </p>
              </div>

              <div className="border border-black px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  03
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[-0.03em] text-[var(--foreground)]">
                  Share your taste
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
                New member setup
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Create an account with a username, email, and password to start building your
                Feelix profile.
              </p>
            </div>

            <form onSubmit={onSubmit} className="grid gap-5 pt-5">
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
                  placeholder="you@uni.ac.uk"
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
                Usernames can use letters, numbers, and underscores. Passwords should be at least 8 characters.
              </p>

              {err ? (
                <div className="border border-black bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)]">
                  {err}
                </div>
              ) : null}

              <div className="grid gap-3 border-t-2 border-black pt-5">
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
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}