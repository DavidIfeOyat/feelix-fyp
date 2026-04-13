"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function PostLoginOnboardingGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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
          ? watchedRes.data.some((row: any) => {
              const reaction = String(
                row?.reaction ?? row?.payload?.reaction ?? ""
              ).toLowerCase();
              return reaction === "like" || reaction === "dislike";
            })
          : false;

        const topFourIds = Array.isArray((profileRes.data as any)?.top_four_ids)
          ? ((profileRes.data as any).top_four_ids as unknown[])
          : [];

        const hasMountRushmorePick = topFourIds.some((x) => {
          const n = Number(x);
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