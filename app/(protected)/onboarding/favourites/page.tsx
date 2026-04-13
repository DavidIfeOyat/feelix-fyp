"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfileHub } from "@/hooks/useProfileHub";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { MountRushmoreSection } from "@/components/features/profile/MountRushmoreSection";

export default function OnboardingFavoritesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const hub = useProfileHub(user?.id);
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selected = hub.topFour.filter((x): x is number => typeof x === "number" && x > 0);
  const hasAtLeastOne = selected.length > 0;

  async function continueOnboarding() {
    if (!user || !hasAtLeastOne) return;

    setErr(null);
    setBusy(true);

    try {
      const rows = hub.topFour
        .map((tmdbId, slotIndex) => {
          if (typeof tmdbId !== "number" || tmdbId <= 0) return null;

          const meta = hub.topFourMeta[tmdbId];

          return {
            user_id: user.id,
            external_id: String(tmdbId),
            title: meta?.title ?? `TMDb #${tmdbId}`,
            poster: meta?.poster ?? "/placeholder.svg",
            payload: {
              tmdbId,
              source: "mount_rushmore_onboarding",
              onboardingSeed: true,
              isMountRushmore: true,
              slotIndex,
            },
          };
        })
        .filter(Boolean);

      if (!rows.length) {
        throw new Error("Pick at least one favourite film.");
      }

      const { error } = await supabase
        .from("favorites_items")
        .upsert(rows, { onConflict: "user_id,external_id" });

      if (error) throw error;

      router.push("/recommendations?onboarded=1");
    } catch (e: unknown) {
      setErr(
        e instanceof Error ? e.message : "Failed to save onboarding favourites."
      );
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) {
    return (
      <section className="container py-8 sm:py-10">
        <div className="mx-auto max-w-5xl border-2 border-black bg-[var(--surface)]">
          <div className="border-b-2 border-black px-4 py-4 sm:px-6">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
              Onboarding
            </p>
            <h1 className="mt-3 text-3xl font-extrabold uppercase leading-none tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
              Loading
            </h1>
          </div>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="container py-8 sm:py-10">
        <div className="mx-auto max-w-4xl border-2 border-black bg-[var(--surface)]">
          <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[1fr_auto] md:items-end md:p-8">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                Onboarding
              </p>
              <h1 className="mt-4 text-3xl font-extrabold uppercase leading-[0.92] tracking-[-0.08em] text-[var(--foreground)] sm:text-5xl">
                Sign in to continue.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
                Pick a favourite film so Feelix can personalise your first recommendations.
              </p>
            </div>

            <div className="grid gap-2 min-[420px]:grid-cols-2 md:grid-cols-1">
              <Link className="btn btn-primary text-center" href="/login">
                Sign In
              </Link>

              <Link className="btn btn-ghost text-center" href="/signup">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (hub.loading) {
    return (
      <section className="container py-8 sm:py-10">
        <div className="mx-auto max-w-5xl border-2 border-black bg-[var(--surface)]">
          <div className="border-b-2 border-black px-4 py-4 sm:px-6">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
              Onboarding
            </p>
            <h1 className="mt-3 text-3xl font-extrabold uppercase leading-none tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
              Loading profile setup
            </h1>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-8 sm:py-10">
      <div className="mx-auto max-w-5xl grid gap-6">
        <section className="border-2 border-black bg-[var(--surface)]">
          <div className="grid border-b-2 border-black sm:grid-cols-3">
            <div className="border-b border-black px-4 py-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:border-b-0 sm:border-r-2 sm:text-[10px]">
              Taste setup
            </div>
            <div className="border-b border-black px-4 py-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:border-b-0 sm:border-r-2 sm:text-[10px]">
              First recommendations
            </div>
            <div className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
              Mount Rushmore
            </div>
          </div>

          <div className="grid gap-5 p-4 sm:p-6 md:grid-cols-[1fr_auto] md:items-end md:p-8">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
                Onboarding
              </p>

              <h1 className="mt-4 text-3xl font-extrabold uppercase leading-[0.92] tracking-[-0.08em] text-[var(--foreground)] sm:text-5xl">
                Set up your taste profile.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
                Add at least 1 favourite film. These picks will seed your first recommendations
                and also appear in your Mount Rushmore.
              </p>
            </div>

            <div className="grid gap-2 min-[420px]:grid-cols-2 md:grid-cols-1 md:w-[260px]">
              <button
                className="btn btn-primary"
                onClick={continueOnboarding}
                disabled={!hasAtLeastOne || busy}
                type="button"
              >
                {busy ? "Saving..." : "Continue to Recommendations"}
              </button>

              <Link href="/profile" className="btn btn-ghost text-center">
                Finish Later
              </Link>
            </div>
          </div>
        </section>

        {err ? (
          <div className="border-2 border-black bg-[var(--surface-strong)] px-4 py-4 text-sm text-[var(--foreground)]">
            {err}
          </div>
        ) : null}

        {banner ? (
          <div className="border-2 border-black bg-[var(--surface-strong)] px-4 py-4 text-sm text-[var(--foreground)]">
            {banner}
          </div>
        ) : null}

        <MountRushmoreSection
          topFour={hub.topFour}
          topFourMeta={hub.topFourMeta}
          setTopFourSlot={hub.setTopFourSlot}
          onNotify={setBanner}
        />

        <section className="border-2 border-black bg-[var(--surface)]">
          <div className="border-b-2 border-black px-4 py-3 sm:px-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)] sm:text-[10px]">
              Progress
            </p>
            <h2 className="mt-2 text-xl font-extrabold uppercase leading-[0.95] tracking-[-0.05em] text-[var(--foreground)] sm:text-2xl">
              Minimum required: 1 film
            </h2>
          </div>

          <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[1fr_auto] md:items-center">
            <p className="text-sm leading-7 text-[var(--foreground)]">
              You have selected <span className="font-bold">{selected.length}</span> film
              {selected.length === 1 ? "" : "s"}. Recommended: all 4.
            </p>

            <button
              className="btn btn-primary md:w-auto"
              onClick={continueOnboarding}
              disabled={!hasAtLeastOne || busy}
              type="button"
            >
              {busy ? "Saving..." : "Continue"}
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}