"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type Busy = null | "watchlist" | "watched" | "favorite";

type FilmLibraryInput = {
  tmdbId: number;
  title: string;
  poster: string;
};

type ToggleWatchedResult = "added" | "removed" | null;

function logSupabaseError(label: string, error: any) {
  console.error(label, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    status: error?.status,
    raw: error,
  });
}

export function useFilmLibrary(input: FilmLibraryInput) {
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

    async function loadLibraryState() {
      if (!user) return;

      const [watchlistQuery, watchedQuery, favoritesQuery] = await Promise.all([
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

      setInWatchlist(Boolean(watchlistQuery.data));
      setIsWatched(Boolean(watchedQuery.data));
      setIsFavorite(Boolean(favoritesQuery.data));
    }

    void loadLibraryState();

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
    } catch (error: any) {
      logSupabaseError("toggleWatchlist failed", error);
    } finally {
      setBusy(null);
    }
  }

  async function toggleWatched(): Promise<ToggleWatchedResult> {
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
      }

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
    } catch (error: any) {
      logSupabaseError("toggleWatched failed", error);
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

        // A favourite is treated as a watched title in the current library model.
        if (!isWatched) {
          const { error: watchedError } = await supabase.from("watched_items").insert({
            user_id: user.id,
            external_id: externalId,
            title: input.title,
            poster: input.poster,
            payload: { tmdbId: input.tmdbId },
            watched_at: new Date().toISOString(),
          });

          if (watchedError && (watchedError as any).code !== "23505") {
            throw watchedError;
          }

          setIsWatched(true);
        }

        await clearWatchlistIfPresent(user.id);
        await clearPlannedWatchIfPresent(user.id);
      }
    } catch (error: any) {
      logSupabaseError("toggleFavorite failed", error);
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