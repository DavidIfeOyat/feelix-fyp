"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { createSupabaseBrowser } from "@/lib/supabase/client";

type TopFourSlots = (number | null)[];

type TopFourMetaItem = {
  tmdbId: number;
  title: string;
  poster: string | null;
  backdrop: string | null;
};

export type ProfileHubData = {
  profile: {
    user_id: string;
    display_name: string;
    username: string | null;
    bio: string | null;
    avatar_url: string | null;
    top_four_ids: (number | null)[] | null;
    mount_rushmore_public: boolean | null;
    watchlist_public: boolean | null;
  } | null;

  counts: {
    followers: number;
    following: number;
    filmsWatched: number;
    watchlistCount: number;
  };

  topFour: TopFourSlots;
  topFourMeta: Record<number, TopFourMetaItem>;

  loading: boolean;
  error: string | null;

  refresh: () => Promise<void>;
  setTopFourSlot: (slotIndex: number, tmdbId: number | null) => Promise<void>;
};

function clampTopFour(ids: unknown[] | null | undefined): TopFourSlots {
  const out: TopFourSlots = [null, null, null, null];
  if (!Array.isArray(ids)) return out;

  for (let i = 0; i < 4; i++) {
    const value = ids[i];
    const n = typeof value === "number" ? value : Number(value);

    out[i] = Number.isFinite(n) && n > 0 ? n : null;
  }

  return out;
}

async function fetchTmdbMini(tmdbId: number): Promise<TopFourMetaItem | null> {
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) return null;

  const res = await fetch(`/api/tmdb/movie/${tmdbId}`, { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("fetchTmdbMini failed:", tmdbId, res.status, text);
    return null;
  }

  const json = await res.json();

  return {
    tmdbId,
    title: String(json.title ?? ""),
    poster: json.poster ?? null,
    backdrop: json.backdrop ?? null,
  };
}

export function useProfileHub(userId?: string | null): ProfileHubData {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const reqId = useRef(0);

  const [profile, setProfile] = useState<ProfileHubData["profile"]>(null);
  const [counts, setCounts] = useState<ProfileHubData["counts"]>({
    followers: 0,
    following: 0,
    filmsWatched: 0,
    watchlistCount: 0,
  });

  const [topFour, setTopFour] = useState<TopFourSlots>([null, null, null, null]);
  const [topFourMeta, setTopFourMeta] = useState<Record<number, TopFourMetaItem>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const myReq = ++reqId.current;
    setLoading(true);
    setError(null);

    if (!userId) {
      setProfile(null);
      setTopFour([null, null, null, null]);
      setTopFourMeta({});
      setCounts({
        followers: 0,
        following: 0,
        filmsWatched: 0,
        watchlistCount: 0,
      });
      setLoading(false);
      return;
    }

    try {
      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select(
          "user_id, display_name, username, bio, avatar_url, top_four_ids, mount_rushmore_public, watchlist_public"
        )
        .eq("user_id", userId)
        .single();

      if (myReq !== reqId.current) return;
      if (profileError) throw profileError;

      setProfile(profileRow as any);

      const four = clampTopFour((profileRow as any)?.top_four_ids);
      setTopFour(four);

      const [followersQ, followingQ, watchedCountQ, watchlistCountQ] = await Promise.all([
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId),

        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId),

        supabase
          .from("watched_items")
          .select("external_id", { count: "exact", head: true })
          .eq("user_id", userId),

        supabase
          .from("watchlist_items")
          .select("external_id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

      if (myReq !== reqId.current) return;

      setCounts({
        followers: Number(followersQ.count ?? 0),
        following: Number(followingQ.count ?? 0),
        filmsWatched: Number(watchedCountQ.count ?? 0),
        watchlistCount: Number(watchlistCountQ.count ?? 0),
      });

      const ids = four.filter((value): value is number => typeof value === "number" && value > 0);
      const missingIds = ids.filter((id) => !topFourMeta[id]);

      if (missingIds.length > 0) {
        const minis = await Promise.all(missingIds.map(fetchTmdbMini));
        if (myReq !== reqId.current) return;

        setTopFourMeta((prev) => {
          const next = { ...prev };

          for (const mini of minis) {
            if (mini?.tmdbId) {
              next[mini.tmdbId] = mini;
            }
          }

          return next;
        });
      }
    } catch (error: any) {
      if (myReq !== reqId.current) return;
      setError(error?.message ? String(error.message) : "Failed to load profile.");
    } finally {
      if (myReq === reqId.current) {
        setLoading(false);
      }
    }
  }

  async function setTopFourSlot(slotIndex: number, tmdbId: number | null) {
    if (!userId) return;

    const safeId =
      typeof tmdbId === "number" && Number.isFinite(tmdbId) && tmdbId > 0
        ? tmdbId
        : null;

    const next: TopFourSlots = [...topFour];
    next[slotIndex] = safeId;

    const slotsToSave: TopFourSlots = [
      next[0] ?? null,
      next[1] ?? null,
      next[2] ?? null,
      next[3] ?? null,
    ];

    const payload = slotsToSave.every((value) => value === null)
      ? null
      : (slotsToSave as any);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ top_four_ids: payload })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    setTopFour(slotsToSave);

    if (safeId) {
      const mini = await fetchTmdbMini(safeId);
      if (mini) {
        setTopFourMeta((prev) => ({ ...prev, [mini.tmdbId]: mini }));
      }
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    profile,
    counts,
    topFour,
    topFourMeta,
    loading,
    error,
    refresh,
    setTopFourSlot,
  };
}