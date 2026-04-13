"use client";

import { useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import * as recoConfig from "@/lib/reco/config";
import type {
  Brainpower,
  DealType,
  Darkness,
  Energy,
  Intensity,
  Pace,
  QuickPreset,
  Region,
  WatchContext,
} from "@/lib/reco/config";

export type RecoItem = {
  tmdbId: number;
  title: string;
  poster: string | null;
  match: number;
  genreIds: number[];
  bestDeal?: { provider: string; type: DealType; region: Region } | null;
};

const FEELING_OPTIONS = Array.isArray(recoConfig.FEELING_OPTIONS)
  ? recoConfig.FEELING_OPTIONS
  : [];

const INTENTION_OPTIONS = Array.isArray(recoConfig.INTENTION_OPTIONS)
  ? recoConfig.INTENTION_OPTIONS
  : [];

const ENERGY_OPTIONS = Array.isArray(recoConfig.ENERGY_OPTIONS)
  ? recoConfig.ENERGY_OPTIONS
  : [];

const PACE_OPTIONS = Array.isArray(recoConfig.PACE_OPTIONS)
  ? recoConfig.PACE_OPTIONS
  : [];

const INTENSITY_OPTIONS = Array.isArray(recoConfig.INTENSITY_OPTIONS)
  ? recoConfig.INTENSITY_OPTIONS
  : [];

const DARKNESS_OPTIONS = Array.isArray(recoConfig.DARKNESS_OPTIONS)
  ? recoConfig.DARKNESS_OPTIONS
  : [];

const BRAINPOWER_OPTIONS = Array.isArray(recoConfig.BRAINPOWER_OPTIONS)
  ? recoConfig.BRAINPOWER_OPTIONS
  : [];

const CONTEXT_OPTIONS = Array.isArray(recoConfig.CONTEXT_OPTIONS)
  ? recoConfig.CONTEXT_OPTIONS
  : [];

const PROVIDER_OPTIONS = Array.isArray(recoConfig.PROVIDER_OPTIONS)
  ? recoConfig.PROVIDER_OPTIONS
  : [];

const QUICK_PRESETS: readonly QuickPreset[] = Array.isArray(recoConfig.QUICK_PRESETS)
  ? recoConfig.QUICK_PRESETS
  : [];

function friendlySaveError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("duplicate key")) return "That film is already in your watchlist.";
  return message;
}

function labelFromValue(
  value: string,
  source: ReadonlyArray<{ value: string; label: string }>
) {
  return source.find((item) => item.value === value)?.label ?? value;
}

function toggleLimited(current: string[], value: string, max: number) {
  if (current.includes(value)) {
    return current.filter((item) => item !== value);
  }

  if (current.length >= max) {
    return current;
  }

  return [...current, value];
}

export function useRecommendationBuilder() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const railRef = useRef<HTMLDivElement | null>(null);

  const [step, setStep] = useState<0 | 1 | 2>(0);

  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);

  const [feelings, setFeelings] = useState<string[]>([]);
  const [intentions, setIntentions] = useState<string[]>([]);

  const [energy, setEnergy] = useState<Energy>("medium");
  const [pace, setPace] = useState<Pace>("balanced");
  const [intensity, setIntensity] = useState<Intensity>("balanced");
  const [darkness, setDarkness] = useState<Darkness>("mixed");
  const [brainpower, setBrainpower] = useState<Brainpower>("engaging");
  const [watchContext, setWatchContext] = useState<WatchContext>("solo");

  const [minRating, setMinRating] = useState(5.0);
  const [maxRating, setMaxRating] = useState(10.0);
  const [maxRuntime, setMaxRuntime] = useState<number>(150);
  const [surpriseMe, setSurpriseMe] = useState(false);
  const [providerIds, setProviderIds] = useState<number[]>([]);

  const [items, setItems] = useState<RecoItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleItem, setScheduleItem] = useState<RecoItem | null>(null);

  const activePreset =
    (Array.isArray(QUICK_PRESETS)
      ? QUICK_PRESETS.find((preset) => preset.key === selectedPresetKey)
      : null) ?? null;

  const canRecommend = feelings.length > 0 || intentions.length > 0;

  const summary = useMemo(() => {
    const feelingText =
      feelings.length > 0
        ? feelings.map((value) => labelFromValue(value, FEELING_OPTIONS)).join(", ")
        : "open mood";

    const intentionText =
      intentions.length > 0
        ? intentions.map((value) => labelFromValue(value, INTENTION_OPTIONS)).join(", ")
        : "any experience";

    const providerText =
      providerIds.length > 0
        ? PROVIDER_OPTIONS.filter((provider) => providerIds.includes(provider.id))
            .map((provider) => provider.label)
            .join(", ")
        : "any provider";

    const presetLead = activePreset ? `Starting from ${activePreset.label}. ` : "";

    return `${presetLead}You feel ${feelingText}. You want ${intentionText}. ${labelFromValue(
      watchContext,
      CONTEXT_OPTIONS
    )}, ${labelFromValue(energy, ENERGY_OPTIONS).toLowerCase()} energy, ${labelFromValue(
      pace,
      PACE_OPTIONS
    ).toLowerCase()}, ${labelFromValue(
      intensity,
      INTENSITY_OPTIONS
    ).toLowerCase()} intensity, ${labelFromValue(
      darkness,
      DARKNESS_OPTIONS
    ).toLowerCase()} tone, ${labelFromValue(
      brainpower,
      BRAINPOWER_OPTIONS
    ).toLowerCase()}. Providers: ${providerText}.`;
  }, [
    activePreset,
    feelings,
    intentions,
    providerIds,
    watchContext,
    energy,
    pace,
    intensity,
    darkness,
    brainpower,
  ]);

  function resetMessages() {
    setErr(null);
    setSaveMsg(null);
  }

  function clearPresetSelection() {
    setSelectedPresetKey(null);
  }

  function setSavedMessage(message: string) {
    setErr(null);
    setSaveMsg(message);
  }

  function slidePresets(direction: "prev" | "next") {
    if (!railRef.current) return;
    const amount = direction === "next" ? 340 : -340;
    railRef.current.scrollBy({ left: amount, behavior: "smooth" });
  }

  function applyPreset(preset: QuickPreset) {
    setSelectedPresetKey(preset.key);
    setFeelings(preset.feelings.slice(0, 2));
    setIntentions(preset.intentions.slice(0, 1));
    setEnergy(preset.energy);
    setPace(preset.pace);
    setIntensity(preset.intensity);
    setDarkness(preset.darkness);
    setBrainpower(preset.brainpower);
    setWatchContext(preset.watchContext);
    setItems([]);
    resetMessages();
    setStep(1);
  }

  function toggleFeeling(value: string) {
    clearPresetSelection();
    setFeelings((prev) => toggleLimited(prev, value, 2));
  }

  function toggleIntention(value: string) {
    clearPresetSelection();
    setIntentions((prev) => toggleLimited(prev, value, 1));
  }

  function toggleProvider(id: number) {
    clearPresetSelection();
    setProviderIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function setEnergyValue(value: Energy) {
    clearPresetSelection();
    setEnergy(value);
  }

  function setPaceValue(value: Pace) {
    clearPresetSelection();
    setPace(value);
  }

  function setIntensityValue(value: Intensity) {
    clearPresetSelection();
    setIntensity(value);
  }

  function setDarknessValue(value: Darkness) {
    clearPresetSelection();
    setDarkness(value);
  }

  function setBrainpowerValue(value: Brainpower) {
    clearPresetSelection();
    setBrainpower(value);
  }

  function setWatchContextValue(value: WatchContext) {
    clearPresetSelection();
    setWatchContext(value);
  }

  function setMaxRuntimeValue(value: number) {
    clearPresetSelection();
    setMaxRuntime(value);
  }

  function setMinRatingValue(value: number) {
    clearPresetSelection();
    setMinRating(value);
  }

  function setMaxRatingValue(value: number) {
    clearPresetSelection();
    setMaxRating(value);
  }

  function setSurpriseMeValue(value: boolean) {
    clearPresetSelection();
    setSurpriseMe(value);
  }

  async function recoApi(payload: Record<string, unknown>) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) throw new Error("No session token");

    const res = await fetch("/api/recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok || json?.ok === false) {
      throw new Error(json?.error || "Request failed");
    }

    return json;
  }

  async function recommend(seed?: number) {
    if (!canRecommend) return;

    resetMessages();
    setBusy(true);

    try {
      const out = await recoApi({
        presetKey: selectedPresetKey,
        feelings,
        intentions,
        energy,
        pace,
        intensity,
        darkness,
        brainpower,
        watchContext,
        region: "GB",
        maxRuntime,
        providerIds,
        minRating,
        maxRating,
        surpriseMe,
        seed: seed ?? Date.now(),
      });

      const got: RecoItem[] = Array.isArray(out?.items) ? (out.items as RecoItem[]) : [];
      setItems(got);
      setStep(2);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to fetch recommendation";
      setErr(message);
    } finally {
      setBusy(false);
    }
  }

  async function addToWatchlist(it: RecoItem) {
    if (!user) return;

    setSaveMsg(null);
    setErr(null);

    try {
      const { error } = await supabase.from("watchlist_items").insert({
        user_id: user.id,
        external_id: String(it.tmdbId),
        title: it.title,
        poster: it.poster ?? "/placeholder.svg",
        payload: {
          tmdbId: it.tmdbId,
          genreIds: it.genreIds ?? [],
          source: "recommendations",
          presetKey: selectedPresetKey,
          feelings,
          intentions,
        },
      });

      if (error) throw error;
      setSaveMsg(`Added "${it.title}" to watchlist.`);
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : "Failed to add to watchlist";
      setErr(friendlySaveError(raw));
    }
  }

  function openSchedule(it: RecoItem) {
    setErr(null);
    setSaveMsg(null);
    setScheduleItem(it);
    setScheduleOpen(true);
  }

  return {
    user,
    loading,
    railRef,
    step,
    setStep,
    selectedPresetKey,
    feelings,
    intentions,
    energy,
    pace,
    intensity,
    darkness,
    brainpower,
    watchContext,
    minRating,
    maxRating,
    maxRuntime,
    surpriseMe,
    providerIds,
    items,
    busy,
    err,
    saveMsg,
    scheduleOpen,
    setScheduleOpen,
    scheduleItem,
    summary,
    canRecommend,
    slidePresets,
    applyPreset,
    toggleFeeling,
    toggleIntention,
    toggleProvider,
    setEnergyValue,
    setPaceValue,
    setIntensityValue,
    setDarknessValue,
    setBrainpowerValue,
    setWatchContextValue,
    setMaxRuntimeValue,
    setMinRatingValue,
    setMaxRatingValue,
    setSurpriseMeValue,
    recommend,
    addToWatchlist,
    openSchedule,
    setSavedMessage,
  };
}