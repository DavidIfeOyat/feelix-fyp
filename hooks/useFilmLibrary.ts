"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Busy = null | "watchlist" | "watched" | "favorite";

function logSupabaseError(label: string, e: any) {
  console.error(label, {
    message: e?.message,
    details: e?.details,
    hint: e?.hint,
    code: e?.code,
    status: e?.status,
    raw: e,
  });
}

export function useFilmLibrary(input: { tmdbId: number; title: string; poster: string }) {
  const { user } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const externalId = useMemo(() => String(input.tmdbId), [input.tmdbId]);

  const [busy, setBusy] = useState<Busy>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  function gateToLogin() {
    const from =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : `/films/${input.tmdbId}`;
    window.location.href = `/login?from=${encodeURIComponent(from)}`;
  }

  useEffect(() => {
    let cancelled = false;

    setInWatchlist(false);
    setIsWatched(false);
    setIsFavorite(false);

    (async () => {
      if (!user) return;

      const [wl, w, fav] = await Promise.all([
        supabase
          .from("watchlist_items")
          .select("external_id")
          .eq("user_id", user.id)
          .eq("external_id", externalId)
          .maybeSingle(),

        supabase
          .from("watched_items")
          .select("external_id")
          .eq("user_id", user.id)
          .eq("external_id", externalId)
          .maybeSingle(),

        supabase
          .from("favorites_items")
          .select("external_id")
          .eq("user_id", user.id)
          .eq("external_id", externalId)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      setInWatchlist(Boolean(wl.data));
      setIsWatched(Boolean(w.data));
      setIsFavorite(Boolean(fav.data));
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, externalId, supabase]);

  async function clearWatchlistIfPresent(currentUserId: string) {
    if (!inWatchlist) return;

    await supabase
      .from("watchlist_items")
      .delete()
      .eq("user_id", currentUserId)
      .eq("external_id", externalId);

    setInWatchlist(false);
  }

  async function clearPlannedWatchIfPresent(currentUserId: string) {
    await supabase
      .from("planned_watches")
      .delete()
      .eq("user_id", currentUserId)
      .eq("external_id", externalId);
  }

  async function toggleWatchlist() {
    if (!user) return gateToLogin();
    if (busy) return;
    setBusy("watchlist");

    try {
      if (inWatchlist) {
        const { error } = await supabase
          .from("watchlist_items")
          .delete()
          .eq("user_id", user.id)
          .eq("external_id", externalId);

        if (error) throw error;
        setInWatchlist(false);
      } else {
        const { error } = await supabase.from("watchlist_items").insert({
          user_id: user.id,
          external_id: externalId,
          title: input.title,
          poster: input.poster,
          payload: { tmdbId: input.tmdbId },
        });

        if (error && (error as any).code !== "23505") throw error;
        setInWatchlist(true);
      }
    } catch (e: any) {
      logSupabaseError("toggleWatchlist failed", e);
    } finally {
      setBusy(null);
    }
  }

  async function toggleWatched(): Promise<"added" | "removed" | null> {
    if (!user) {
      gateToLogin();
      return null;
    }
    if (busy) return null;

    setBusy("watched");

    try {
      if (isWatched) {
        const { error } = await supabase
          .from("watched_items")
          .delete()
          .eq("user_id", user.id)
          .eq("external_id", externalId);

        if (error) throw error;
        setIsWatched(false);
        return "removed";
      } else {
        const { error } = await supabase.from("watched_items").insert({
          user_id: user.id,
          external_id: externalId,
          title: input.title,
          poster: input.poster,
          payload: { tmdbId: input.tmdbId },
          watched_at: new Date().toISOString(),
        });

        if (error && (error as any).code !== "23505") throw error;

        setIsWatched(true);
        await clearWatchlistIfPresent(user.id);
        await clearPlannedWatchIfPresent(user.id);

        return "added";
      }
    } catch (e: any) {
      logSupabaseError("toggleWatched failed", e);
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function toggleFavorite() {
    if (!user) return gateToLogin();
    if (busy) return;

    setBusy("favorite");

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorites_items")
          .delete()
          .eq("user_id", user.id)
          .eq("external_id", externalId);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase.from("favorites_items").insert({
          user_id: user.id,
          external_id: externalId,
          title: input.title,
          poster: input.poster,
          payload: { tmdbId: input.tmdbId },
        });

        if (error && (error as any).code !== "23505") throw error;
        setIsFavorite(true);

        if (!isWatched) {
          const { error: wErr } = await supabase.from("watched_items").insert({
            user_id: user.id,
            external_id: externalId,
            title: input.title,
            poster: input.poster,
            payload: { tmdbId: input.tmdbId },
            watched_at: new Date().toISOString(),
          });

          if (wErr && (wErr as any).code !== "23505") throw wErr;
          setIsWatched(true);
        }

        await clearWatchlistIfPresent(user.id);
        await clearPlannedWatchIfPresent(user.id);
      }
    } catch (e: any) {
      logSupabaseError("toggleFavorite failed", e);
    } finally {
      setBusy(null);
    }
  }

  async function saveWatchedFeedback(liked: boolean) {
    if (!user) {
      gateToLogin();
      return;
    }

    const { error } = await supabase.from("film_feedback").upsert(
      {
        user_id: user.id,
        external_id: externalId,
        tmdb_id: input.tmdbId,
        liked,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,external_id" }
    );

    if (error) throw error;
  }

  return {
    busy,
    inWatchlist,
    isWatched,
    isFavorite,
    toggleWatchlist,
    toggleWatched,
    toggleFavorite,
    saveWatchedFeedback,
  };
}