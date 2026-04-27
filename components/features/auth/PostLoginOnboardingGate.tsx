"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type PostLoginOnboardingGateProps = {
  children: React.ReactNode;
};

type WatchedFeedbackRow = {
  reaction?: unknown;
  payload?: {
    reaction?: unknown;
  } | null;
};

type ProfileTopFourRow = {
  top_four_ids?: unknown;
};

export function PostLoginOnboardingGate({
  children,
}: PostLoginOnboardingGateProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Stable client instance for onboarding checks.
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  const [checking, setChecking] = useState(true);
  const redirectedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function checkOnboarding() {
      if (loading) return;

      if (!user) {
        if (!cancelled) setChecking(false);
        return;
      }

      // Avoid redirecting away from the onboarding flow itself.
      if (pathname?.startsWith("/onboarding/favourites")) {
        if (!cancelled) setChecking(false);
        return;
      }

      if (redirectedRef.current) return;

      try {
        const userId = user.id;

        const [favRes, watchedRes, profileRes] = await Promise.all([
          supabase
            .from("favorites_items")
            .select("external_id", { count: "exact", head: true })
            .eq("user_id", userId),

          supabase
            .from("watched_items")
            .select("reaction, payload")
            .eq("user_id", userId)
            .limit(20),

          supabase
            .from("profiles")
            .select("top_four_ids")
            .eq("id", userId)
            .maybeSingle(),
        ]);

        const favoriteCount = favRes.count ?? 0;

        const hasWatchedFeedback = Array.isArray(watchedRes.data)
          ? watchedRes.data.some((row: WatchedFeedbackRow) => {
              const reaction = String(
                row?.reaction ?? row?.payload?.reaction ?? ""
              ).toLowerCase();

              return reaction === "like" || reaction === "dislike";
            })
          : false;

        const profileData = (profileRes.data ?? null) as ProfileTopFourRow | null;

        const topFourIds = Array.isArray(profileData?.top_four_ids)
          ? (profileData.top_four_ids as unknown[])
          : [];

        const hasMountRushmorePick = topFourIds.some((value) => {
          const n = Number(value);
          return Number.isFinite(n) && n > 0;
        });

        const hasTasteSignals =
          favoriteCount > 0 || hasWatchedFeedback || hasMountRushmorePick;

        if (!hasTasteSignals) {
          redirectedRef.current = true;
          router.replace("/onboarding/favourites");
          return;
        }
      } catch (e) {
        console.error("Onboarding gate failed:", e);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    void checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [loading, user, pathname, router, supabase]);

  if (loading || checking) {
    return <p className="container py-10">Loading…</p>;
  }

  return <>{children}</>;
}