import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { tmdb, posterUrl } from "@/lib/tmdb/tmdb";
import {
  findPresetDefinition,
  type Brainpower,
  type Darkness,
  type DealType,
  type Energy,
  type Intensity,
  type Pace,
  type Region,
  type WatchContext,
} from "@/lib/reco/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StructuredMoodInput = {
  feelings: string[];
  intentions: string[];
  energy: Energy;
  pace: Pace;
  intensity: Intensity;
  darkness: Darkness;
  brainpower: Brainpower;
  watchContext: WatchContext;
};

type RecoItem = {
  tmdbId: number;
  title: string;
  poster: string | null;
  match: number;
  genreIds: number[];
  bestDeal: { provider: string; type: DealType; region: Region } | null;
};

type ProviderRow = {
  provider_name?: unknown;
  provider_id?: unknown;
};

type WatchProvidersResponse = {
  results?: Record<
    string,
    {
      flatrate?: ProviderRow[];
      rent?: ProviderRow[];
      buy?: ProviderRow[];
    }
  >;
};

type TMDbMovie = {
  id: number;
  title?: string;
  poster_path?: string | null;
  genre_ids?: number[];
  vote_average?: number;
  popularity?: number;
};

type TMDbMovieDetails = {
  genres?: Array<{ id?: number }>;
};

type TMDbKeywordSearchResponse = {
  results?: Array<{ id?: number }>;
};

type FavoriteRow = {
  external_id?: unknown;
  tmdb_id?: unknown;
  payload?: {
    tmdbId?: unknown;
    genreIds?: unknown;
    genre_ids?: unknown;
  } | null;
};

type WatchlistRow = {
  external_id?: unknown;
  payload?: {
    tmdbId?: unknown;
    genreIds?: unknown;
    genre_ids?: unknown;
  } | null;
};

type FilmFeedbackRow = {
  external_id?: unknown;
  tmdb_id?: unknown;
  liked?: unknown;
};

type ProfileRow = {
  top_four_ids?: unknown;
};

type UserTasteProfile = {
  watchedTmdbIds: Set<number>;
  savedTmdbIds: Set<number>;
  excludedTmdbIds: Set<number>;
  likedTmdbIds: Set<number>;
  dislikedTmdbIds: Set<number>;
  likedGenres: Map<number, number>;
  dislikedGenres: Map<number, number>;
};

const GENRES = {
  ACTION: 28,
  ADVENTURE: 12,
  ANIMATION: 16,
  COMEDY: 35,
  CRIME: 80,
  DOCUMENTARY: 99,
  DRAMA: 18,
  FAMILY: 10751,
  FANTASY: 14,
  HISTORY: 36,
  HORROR: 27,
  MYSTERY: 9648,
  ROMANCE: 10749,
  SCI_FI: 878,
  THRILLER: 53,
  WAR: 10752,
} as const;

const DEFAULT_GENRES = [GENRES.DRAMA, GENRES.THRILLER, GENRES.COMEDY];

const FEELING_GENRES: Record<string, number[]> = {
  relaxed: [GENRES.COMEDY, GENRES.ROMANCE, GENRES.FAMILY],
  stressed: [GENRES.COMEDY, GENRES.DRAMA, GENRES.ROMANCE],
  tired: [GENRES.COMEDY, GENRES.FAMILY, GENRES.DRAMA],
  excited: [GENRES.ACTION, GENRES.ADVENTURE, GENRES.THRILLER],
  curious: [GENRES.MYSTERY, GENRES.SCI_FI, GENRES.THRILLER],
  romantic: [GENRES.ROMANCE, GENRES.COMEDY, GENRES.DRAMA],
  reflective: [GENRES.DRAMA, GENRES.MYSTERY, GENRES.ROMANCE],
  hopeful: [GENRES.DRAMA, GENRES.COMEDY, GENRES.FAMILY],
  lonely: [GENRES.DRAMA, GENRES.ROMANCE, GENRES.MYSTERY],
  playful: [GENRES.COMEDY, GENRES.ADVENTURE, GENRES.FAMILY],
  bored: [GENRES.THRILLER, GENRES.ACTION, GENRES.MYSTERY],
  overwhelmed: [GENRES.COMEDY, GENRES.FAMILY, GENRES.FANTASY],
};

const FEELING_HINTS: Record<string, string[]> = {
  relaxed: ["feel good", "gentle", "warm"],
  stressed: ["comfort", "uplifting", "easy watch"],
  tired: ["easy watch", "light", "cozy"],
  excited: ["high stakes", "stylish action", "adrenaline"],
  curious: ["mystery", "investigation", "mind-bending"],
  romantic: ["love story", "chemistry", "romantic"],
  reflective: ["character study", "emotional", "quiet drama"],
  hopeful: ["heartwarming", "hopeful", "uplifting"],
  lonely: ["emotional", "intimate", "bittersweet"],
  playful: ["fun", "adventure", "lighthearted"],
  bored: ["unexpected twist", "hooked", "suspense"],
  overwhelmed: ["escapism", "comfort", "fantasy"],
};

const INTENTION_GENRES: Record<string, number[]> = {
  "comfort me": [GENRES.COMEDY, GENRES.ROMANCE, GENRES.FAMILY, GENRES.DRAMA],
  "make me laugh": [GENRES.COMEDY, GENRES.FAMILY, GENRES.ADVENTURE],
  "keep me hooked": [GENRES.THRILLER, GENRES.CRIME, GENRES.MYSTERY, GENRES.ACTION],
  "make me think": [GENRES.DRAMA, GENRES.MYSTERY, GENRES.SCI_FI, GENRES.DOCUMENTARY],
  "help me escape": [GENRES.ADVENTURE, GENRES.FANTASY, GENRES.SCI_FI, GENRES.COMEDY],
  "give me romance": [GENRES.ROMANCE, GENRES.COMEDY, GENRES.DRAMA],
  "give me adrenaline": [GENRES.ACTION, GENRES.THRILLER, GENRES.CRIME, GENRES.ADVENTURE],
  "move me emotionally": [GENRES.DRAMA, GENRES.ROMANCE, GENRES.COMEDY],
  "mind-bending": [GENRES.SCI_FI, GENRES.MYSTERY, GENRES.THRILLER],
  heartwarming: [GENRES.FAMILY, GENRES.COMEDY, GENRES.DRAMA],
  "dark and gripping": [GENRES.THRILLER, GENRES.CRIME, GENRES.HORROR, GENRES.MYSTERY],
};

const INTENTION_HINTS: Record<string, string[]> = {
  "comfort me": ["heartwarming", "feel good", "found family"],
  "make me laugh": ["funny", "lighthearted", "comedy"],
  "keep me hooked": ["suspense", "twist", "cat and mouse"],
  "make me think": ["thought-provoking", "philosophical", "layered"],
  "help me escape": ["immersive world", "escapist", "adventure"],
  "give me romance": ["love story", "chemistry", "romantic"],
  "give me adrenaline": ["chase", "high stakes", "action"],
  "move me emotionally": ["moving", "bittersweet", "emotional"],
  "mind-bending": ["time loop", "reality", "mind-bending"],
  heartwarming: ["warm", "uplifting", "comfort"],
  "dark and gripping": ["crime noir", "psychological", "dark"],
};

const ENERGY_GENRES: Record<Energy, number[]> = {
  low: [GENRES.DRAMA, GENRES.COMEDY, GENRES.ROMANCE],
  medium: [GENRES.DRAMA, GENRES.MYSTERY, GENRES.COMEDY],
  high: [GENRES.ACTION, GENRES.THRILLER, GENRES.ADVENTURE],
};

const PACE_GENRES: Record<Pace, number[]> = {
  slow: [GENRES.DRAMA, GENRES.MYSTERY, GENRES.ROMANCE],
  balanced: [GENRES.DRAMA, GENRES.THRILLER, GENRES.COMEDY],
  fast: [GENRES.ACTION, GENRES.THRILLER, GENRES.CRIME],
};

const INTENSITY_GENRES: Record<Intensity, number[]> = {
  light: [GENRES.COMEDY, GENRES.FAMILY, GENRES.ROMANCE],
  balanced: [GENRES.DRAMA, GENRES.MYSTERY, GENRES.COMEDY],
  intense: [GENRES.THRILLER, GENRES.CRIME, GENRES.HORROR, GENRES.ACTION],
};

const DARKNESS_GENRES: Record<Darkness, number[]> = {
  light: [GENRES.COMEDY, GENRES.FAMILY, GENRES.ROMANCE],
  mixed: [GENRES.DRAMA, GENRES.MYSTERY, GENRES.THRILLER],
  dark: [GENRES.THRILLER, GENRES.CRIME, GENRES.HORROR, GENRES.MYSTERY],
};

const BRAINPOWER_GENRES: Record<Brainpower, number[]> = {
  easy: [GENRES.COMEDY, GENRES.FAMILY, GENRES.ROMANCE],
  engaging: [GENRES.MYSTERY, GENRES.THRILLER, GENRES.DRAMA],
  deep: [GENRES.DRAMA, GENRES.SCI_FI, GENRES.MYSTERY, GENRES.DOCUMENTARY],
};

const CONTEXT_GENRES: Record<WatchContext, number[]> = {
  solo: [GENRES.DRAMA, GENRES.MYSTERY, GENRES.SCI_FI],
  date: [GENRES.ROMANCE, GENRES.COMEDY, GENRES.DRAMA],
  friends: [GENRES.ACTION, GENRES.COMEDY, GENRES.ADVENTURE, GENRES.THRILLER],
  family: [GENRES.FAMILY, GENRES.ANIMATION, GENRES.COMEDY, GENRES.ADVENTURE],
};

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function bearer(req: Request) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

function supabaseAuthed(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !anon) throw new Error("Supabase env missing");

  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function safeJson(req: Request): Promise<Record<string, unknown>> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function clampInt(n: number, min: number, max: number) {
  const v = Math.trunc(Number(n));
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function uniqInts(v: unknown, max: number) {
  const out: number[] = [];
  const seen = new Set<number>();

  if (!Array.isArray(v)) return out;

  for (const x of v) {
    const n = Number(x);
    if (!Number.isFinite(n)) continue;

    const i = Math.trunc(n);
    if (seen.has(i)) continue;

    seen.add(i);
    out.push(i);

    if (out.length >= max) break;
  }

  return out;
}

function uniqStrings(values: string[], max: number) {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = normalizeText(value);
    if (!normalized || seen.has(normalized)) continue;

    seen.add(normalized);
    out.push(normalized);

    if (out.length >= max) break;
  }

  return out;
}

function stringArray(v: unknown, max: number) {
  if (!Array.isArray(v)) return [];
  return uniqStrings(
    v.map((x) => String(x ?? "")),
    max
  );
}

function parseEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const normalized = normalizeText(String(value ?? ""));
  return allowed.find((item) => normalizeText(item) === normalized) ?? fallback;
}

function addWeightedGenres(target: Map<number, number>, genreIds: number[], weight: number) {
  for (const genreId of genreIds) {
    target.set(genreId, (target.get(genreId) ?? 0) + weight);
  }
}

function topGenreIds(scores: Map<number, number>, limit: number) {
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([genreId]) => genreId)
    .slice(0, limit);
}

function keywordHintListFromMap(keys: string[], source: Record<string, string[]>) {
  const hints: string[] = [];

  for (const key of keys) {
    const found = source[key];
    if (found?.length) hints.push(...found);
  }

  return hints;
}

type ProviderEntry = {
  provider: string;
  providerId: number;
  type: DealType;
};

function providerEntries(wp: WatchProvidersResponse, region: Region): ProviderEntry[] {
  const r = wp?.results?.[region];
  if (!r) return [];

  const read = (rows: ProviderRow[] | undefined, type: DealType): ProviderEntry[] => {
    if (!Array.isArray(rows)) return [];

    return rows
      .map((row) => {
        const provider = String(row?.provider_name ?? "").trim();
        const providerId = Number(row?.provider_id);
        if (!provider || !Number.isFinite(providerId)) return null;

        return {
          provider,
          providerId,
          type,
        };
      })
      .filter((entry): entry is ProviderEntry => Boolean(entry));
  };

  return [
    ...read(r.flatrate, "stream"),
    ...read(r.rent, "rent"),
    ...read(r.buy, "buy"),
  ];
}

function hasSelectedStreamProvider(
  wp: WatchProvidersResponse,
  region: Region,
  providerIds: number[]
) {
  if (!providerIds.length) return true;

  const entries = providerEntries(wp, region);
  return entries.some(
    (entry) => entry.type === "stream" && providerIds.includes(entry.providerId)
  );
}

function bestDeal(
  wp: WatchProvidersResponse,
  region: Region,
  preferredProviderIds: number[] = []
): RecoItem["bestDeal"] {
  const entries = providerEntries(wp, region);
  if (!entries.length) return null;

  const preferred =
    preferredProviderIds.length > 0
      ? entries.find(
          (entry) =>
            entry.type === "stream" && preferredProviderIds.includes(entry.providerId)
        ) ??
        entries.find((entry) => preferredProviderIds.includes(entry.providerId))
      : null;

  const chosen =
    preferred ??
    entries.find((entry) => entry.type === "stream") ??
    entries[0];

  return {
    provider: chosen.provider,
    type: chosen.type,
    region,
  };
}

async function keywordIdsFromTmdb(text: string) {
  const q = normalizeText(text);
  if (!q) return [];

  const r = await tmdb<TMDbKeywordSearchResponse>(
    "/search/keyword",
    { query: q, page: 1 },
    { revalidate: false }
  );

  const ids = (r.results ?? []).map((x) => x.id);
  return uniqInts(ids, 5);
}

async function keywordIdsFromHints(hints: string[]) {
  const uniqueHints = uniqStrings(hints, 5);
  if (!uniqueHints.length) return [];

  const all = await Promise.all(uniqueHints.map((hint) => keywordIdsFromTmdb(hint)));
  return uniqInts(all.flat(), 5);
}

function extractTmdbId(row: {
  tmdb_id?: unknown;
  external_id?: unknown;
  payload?: FavoriteRow["payload"] | WatchlistRow["payload"];
}) {
  const raw = row.tmdb_id ?? row.payload?.tmdbId ?? row.external_id;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

function extractGenreIdsFromPayload(
  payload: FavoriteRow["payload"] | WatchlistRow["payload"]
) {
  return uniqInts(payload?.genreIds ?? payload?.genre_ids ?? [], 20);
}

function feedbackKey(tmdbId: number | null, externalId: unknown) {
  const external = String(externalId ?? "").trim();
  if (tmdbId !== null) return `tmdb:${tmdbId}`;
  if (external) return `ext:${external}`;
  return null;
}

async function fetchGenresForMovieIds(ids: number[]) {
  const uniqueIds = [...new Set(ids)].slice(0, 12);
  const out = new Map<number, number[]>();

  if (!uniqueIds.length) return out;

  await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const details = await tmdb<TMDbMovieDetails>(
          `/movie/${id}`,
          { language: "en-GB" },
          { revalidate: false }
        );

        const genreIds = uniqInts(
          (details.genres ?? []).map((g) => g.id),
          20
        );

        out.set(id, genreIds);
      } catch {
        out.set(id, []);
      }
    })
  );

  return out;
}

function queueGenreWeight(
  map: Map<number, { liked: number; disliked: number }>,
  tmdbId: number,
  kind: "liked" | "disliked",
  weight: number
) {
  const existing = map.get(tmdbId) ?? { liked: 0, disliked: 0 };
  existing[kind] += weight;
  map.set(tmdbId, existing);
}

async function buildUserTasteProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserTasteProfile> {
  const [favoritesRes, feedbackRes, watchlistRes, profileRes] = await Promise.all([
    supabase
      .from("favorites_items")
      .select("external_id, tmdb_id, payload")
      .eq("user_id", userId)
      .limit(100),
    supabase
      .from("film_feedback")
      .select("external_id, tmdb_id, liked")
      .eq("user_id", userId)
      .limit(200),
    supabase
      .from("watchlist_items")
      .select("external_id, payload")
      .eq("user_id", userId)
      .limit(150),
    supabase
      .from("profiles")
      .select("top_four_ids")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const favoriteRows = (favoritesRes.data ?? []) as FavoriteRow[];
  const feedbackRows = (feedbackRes.data ?? []) as FilmFeedbackRow[];
  const watchlistRows = (watchlistRes.data ?? []) as WatchlistRow[];
  const profileRow = (profileRes.data ?? null) as ProfileRow | null;

  const topFourIds = uniqInts(profileRow?.top_four_ids ?? [], 4);

  const watchedTmdbIds = new Set<number>();
  const savedTmdbIds = new Set<number>();
  const likedTmdbIds = new Set<number>();
  const dislikedTmdbIds = new Set<number>();
  const likedGenres = new Map<number, number>();
  const dislikedGenres = new Map<number, number>();

  const feedbackStateByKey = new Map<string, boolean>();

  for (const row of feedbackRows) {
    const tmdbId = extractTmdbId(row);
    const key = feedbackKey(tmdbId, row.external_id);

    if (key !== null) feedbackStateByKey.set(key, Boolean(row.liked));
    if (tmdbId !== null) feedbackStateByKey.set(`tmdb:${tmdbId}`, Boolean(row.liked));

    const external = String(row.external_id ?? "").trim();
    if (external) feedbackStateByKey.set(`ext:${external}`, Boolean(row.liked));
  }

  const queuedGenreWeights = new Map<number, { liked: number; disliked: number }>();

  for (const row of watchlistRows) {
    const tmdbId = extractTmdbId(row);
    if (tmdbId === null) continue;

    savedTmdbIds.add(tmdbId);

    const genreIds = extractGenreIdsFromPayload(row.payload);
    if (genreIds.length) {
      addWeightedGenres(likedGenres, genreIds, 1.4);
    } else {
      queueGenreWeight(queuedGenreWeights, tmdbId, "liked", 1.4);
    }
  }

  for (const tmdbId of topFourIds) {
    likedTmdbIds.add(tmdbId);
    queueGenreWeight(queuedGenreWeights, tmdbId, "liked", 4.5);
  }

  for (const row of favoriteRows) {
    const tmdbId = extractTmdbId(row);
    if (tmdbId === null) continue;

    savedTmdbIds.add(tmdbId);
    watchedTmdbIds.add(tmdbId);

    const key = feedbackKey(tmdbId, row.external_id);
    const explicitFeedback = key ? feedbackStateByKey.get(key) : undefined;

    if (explicitFeedback === false) {
      dislikedTmdbIds.add(tmdbId);

      const genreIds = extractGenreIdsFromPayload(row.payload);
      if (genreIds.length) {
        addWeightedGenres(dislikedGenres, genreIds, 3.25);
      } else {
        queueGenreWeight(queuedGenreWeights, tmdbId, "disliked", 3.25);
      }
      continue;
    }

    likedTmdbIds.add(tmdbId);

    const genreIds = extractGenreIdsFromPayload(row.payload);
    if (genreIds.length) {
      addWeightedGenres(likedGenres, genreIds, 2.75);
    } else {
      queueGenreWeight(queuedGenreWeights, tmdbId, "liked", 2.75);
    }
  }

  for (const row of feedbackRows) {
    const tmdbId = extractTmdbId(row);
    if (tmdbId === null) continue;

    watchedTmdbIds.add(tmdbId);

    const liked = Boolean(row.liked);

    if (liked) {
      likedTmdbIds.add(tmdbId);
      dislikedTmdbIds.delete(tmdbId);
      queueGenreWeight(queuedGenreWeights, tmdbId, "liked", 3.5);
    } else {
      dislikedTmdbIds.add(tmdbId);
      likedTmdbIds.delete(tmdbId);
      queueGenreWeight(queuedGenreWeights, tmdbId, "disliked", 3.9);
    }
  }

  const lookedUpGenres = await fetchGenresForMovieIds([...queuedGenreWeights.keys()]);

  for (const [tmdbId, weights] of queuedGenreWeights.entries()) {
    const genreIds = lookedUpGenres.get(tmdbId) ?? [];
    if (!genreIds.length) continue;

    if (weights.liked > 0) addWeightedGenres(likedGenres, genreIds, weights.liked);
    if (weights.disliked > 0) addWeightedGenres(dislikedGenres, genreIds, weights.disliked);
  }

  const excludedTmdbIds = new Set<number>([...savedTmdbIds, ...watchedTmdbIds]);

  return {
    watchedTmdbIds,
    savedTmdbIds,
    excludedTmdbIds,
    likedTmdbIds,
    dislikedTmdbIds,
    likedGenres,
    dislikedGenres,
  };
}

function scoreMatchAdvanced(
  movie: TMDbMovie,
  targetGenres: Map<number, number>,
  taste: UserTasteProfile
) {
  const movieGenres: number[] = Array.isArray(movie?.genre_ids)
    ? movie.genre_ids.map((x) => Number(x)).filter(Number.isFinite)
    : [];

  let targetWeightTotal = 0;
  for (const weight of targetGenres.values()) {
    targetWeightTotal += weight;
  }

  let matchedWeight = 0;
  for (const genreId of movieGenres) {
    matchedWeight += targetGenres.get(genreId) ?? 0;
  }

  const overlap = movieGenres.filter((g) => targetGenres.has(g)).length;
  const weightedIntentScore = targetWeightTotal ? matchedWeight / targetWeightTotal : 0;
  const precisionScore = movieGenres.length ? overlap / movieGenres.length : 0;
  const intentScore = 0.78 * weightedIntentScore + 0.22 * precisionScore;

  let likedAffinity = 0;
  let dislikedAffinity = 0;

  for (const genreId of movieGenres) {
    likedAffinity += taste.likedGenres.get(genreId) ?? 0;
    dislikedAffinity += taste.dislikedGenres.get(genreId) ?? 0;
  }

  const voteScore = clamp(Number(movie?.vote_average ?? 0) / 10, 0, 1);
  const popScore = clamp(Number(movie?.popularity ?? 0) / 250, 0, 1);

  const positiveTasteBoost = clamp(likedAffinity * 0.035, 0, 0.3);
  const negativeTastePenalty = clamp(dislikedAffinity * 0.06, 0, 0.42);
  const fillerPenalty = popScore > 0.72 && intentScore < 0.4 ? 0.08 : 0;

  const score =
    0.68 * intentScore +
    0.17 * voteScore +
    0.03 * popScore +
    positiveTasteBoost -
    negativeTastePenalty -
    fillerPenalty;

  return clamp(Number(score.toFixed(2)), 0, 1);
}

function getStructuredInput(body: Record<string, unknown>): StructuredMoodInput {
  const feelings = stringArray(body.feelings, 3);
  const intentions = stringArray(body.intentions, 2);

  const allowedEnergy = ["low", "medium", "high"] as const;
  const allowedPace = ["slow", "balanced", "fast"] as const;
  const allowedIntensity = ["light", "balanced", "intense"] as const;
  const allowedDarkness = ["light", "mixed", "dark"] as const;
  const allowedBrainpower = ["easy", "engaging", "deep"] as const;
  const allowedContext = ["solo", "date", "friends", "family"] as const;

  let input: StructuredMoodInput = {
    feelings,
    intentions,
    energy: parseEnum(body.energy, allowedEnergy, "medium"),
    pace: parseEnum(body.pace, allowedPace, "balanced"),
    intensity: parseEnum(body.intensity, allowedIntensity, "balanced"),
    darkness: parseEnum(body.darkness, allowedDarkness, "mixed"),
    brainpower: parseEnum(body.brainpower, allowedBrainpower, "engaging"),
    watchContext: parseEnum(body.watchContext, allowedContext, "solo"),
  };

  const presetKey = String(body.presetKey ?? body.moodKey ?? "").trim();
  const preset = findPresetDefinition(presetKey);

  if (preset) {
    if (input.feelings.length === 0) input.feelings = uniqStrings(preset.feelings, 3);
    if (input.intentions.length === 0) input.intentions = uniqStrings(preset.intentions, 2);
    if (!String(body.energy ?? "").trim()) input.energy = preset.energy;
    if (!String(body.pace ?? "").trim()) input.pace = preset.pace;
    if (!String(body.intensity ?? "").trim()) input.intensity = preset.intensity;
    if (!String(body.darkness ?? "").trim()) input.darkness = preset.darkness;
    if (!String(body.brainpower ?? "").trim()) input.brainpower = preset.brainpower;
    if (!String(body.watchContext ?? "").trim()) input.watchContext = preset.watchContext;
  }

  return input;
}

async function buildMoodSignals(input: StructuredMoodInput) {
  const genreScores = new Map<number, number>();
  const keywordHints: string[] = [];

  for (const feeling of input.feelings) {
    addWeightedGenres(genreScores, FEELING_GENRES[feeling] ?? [], 1.8);
  }

  for (const intention of input.intentions) {
    addWeightedGenres(genreScores, INTENTION_GENRES[intention] ?? [], 2.35);
  }

  keywordHints.push(...keywordHintListFromMap(input.feelings, FEELING_HINTS));
  keywordHints.push(...keywordHintListFromMap(input.intentions, INTENTION_HINTS));

  addWeightedGenres(genreScores, ENERGY_GENRES[input.energy], 1.2);
  addWeightedGenres(genreScores, PACE_GENRES[input.pace], 1.1);
  addWeightedGenres(genreScores, INTENSITY_GENRES[input.intensity], 1.2);
  addWeightedGenres(genreScores, DARKNESS_GENRES[input.darkness], 1.1);
  addWeightedGenres(genreScores, BRAINPOWER_GENRES[input.brainpower], 1.05);
  addWeightedGenres(genreScores, CONTEXT_GENRES[input.watchContext], 1.05);

  if (input.energy === "high") keywordHints.push("adrenaline", "fast-paced");
  if (input.energy === "low") keywordHints.push("comfort", "gentle");
  if (input.pace === "slow") keywordHints.push("slow burn");
  if (input.pace === "fast") keywordHints.push("high stakes", "urgent");
  if (input.intensity === "light") keywordHints.push("easy watch", "lighthearted");
  if (input.intensity === "intense") keywordHints.push("intense", "tense");
  if (input.darkness === "dark") keywordHints.push("dark", "psychological");
  if (input.darkness === "light") keywordHints.push("feel good", "warm");
  if (input.brainpower === "deep") keywordHints.push("thought-provoking", "layered");
  if (input.brainpower === "easy") keywordHints.push("accessible", "easy watch");
  if (input.watchContext === "date") keywordHints.push("chemistry", "romantic");
  if (input.watchContext === "friends") keywordHints.push("crowd pleasing", "fun");
  if (input.watchContext === "family") keywordHints.push("family friendly", "uplifting");

  let genreIds = topGenreIds(genreScores, 5);
  if (genreIds.length < 3) {
    genreIds = uniqInts([...genreIds, ...DEFAULT_GENRES], 5);
  }

  const keywordIds = await keywordIdsFromHints(keywordHints);

  return {
    genreIds,
    keywordIds,
    keywordHints: uniqStrings(keywordHints, 8),
    genreScores,
  };
}

async function discoverWithFallback(opts: {
  region: Region;
  maxRuntime: number;
  ratingMin: number;
  ratingMax: number;
  providerIds: number[];
  genres: number[];
  keywords: number[];
  excluded: Set<number>;
}) {
  const { region, maxRuntime, ratingMin, ratingMax, providerIds, genres, keywords, excluded } =
    opts;

  const attempts: Array<{ name: string; params: Record<string, string | number | undefined> }> =
    providerIds.length > 0
      ? [
          {
            name: "strict_with_providers",
            params: {
              language: "en-GB",
              region,
              include_adult: "false",
              sort_by: "popularity.desc",
              with_genres: genres.length ? genres.join(",") : undefined,
              with_keywords: keywords.length ? keywords.join("|") : undefined,
              with_watch_providers: providerIds.join("|"),
              with_watch_monetization_types: "flatrate",
              watch_region: region,
              "with_runtime.lte": maxRuntime,
              "vote_average.gte": ratingMin,
              "vote_average.lte": ratingMax,
              "vote_count.gte": 50,
            },
          },
          {
            name: "no_keywords_with_providers",
            params: {
              language: "en-GB",
              region,
              include_adult: "false",
              sort_by: "popularity.desc",
              with_genres: genres.length ? genres.join(",") : undefined,
              with_watch_providers: providerIds.join("|"),
              with_watch_monetization_types: "flatrate",
              watch_region: region,
              "with_runtime.lte": maxRuntime,
              "vote_average.gte": ratingMin,
              "vote_average.lte": ratingMax,
              "vote_count.gte": 20,
            },
          },
          {
            name: "relaxed_filters_with_providers",
            params: {
              language: "en-GB",
              region,
              include_adult: "false",
              sort_by: "popularity.desc",
              with_genres: genres.slice(0, 3).join(",") || undefined,
              with_watch_providers: providerIds.join("|"),
              with_watch_monetization_types: "flatrate",
              watch_region: region,
              "with_runtime.lte": maxRuntime,
              "vote_average.gte": Math.max(0, ratingMin - 1),
              "vote_average.lte": ratingMax,
              "vote_count.gte": 10,
            },
          },
        ]
      : [
          {
            name: "strict",
            params: {
              language: "en-GB",
              region,
              include_adult: "false",
              sort_by: "popularity.desc",
              with_genres: genres.length ? genres.join(",") : undefined,
              with_keywords: keywords.length ? keywords.join("|") : undefined,
              "with_runtime.lte": maxRuntime,
              "vote_average.gte": ratingMin,
              "vote_average.lte": ratingMax,
              "vote_count.gte": 50,
            },
          },
          {
            name: "no_keywords",
            params: {
              language: "en-GB",
              region,
              include_adult: "false",
              sort_by: "popularity.desc",
              with_genres: genres.length ? genres.join(",") : undefined,
              "with_runtime.lte": maxRuntime,
              "vote_average.gte": ratingMin,
              "vote_average.lte": ratingMax,
              "vote_count.gte": 20,
            },
          },
          {
            name: "relaxed_filters",
            params: {
              language: "en-GB",
              region,
              include_adult: "false",
              sort_by: "popularity.desc",
              with_genres: genres.slice(0, 3).join(",") || undefined,
              "with_runtime.lte": maxRuntime,
              "vote_average.gte": Math.max(0, ratingMin - 1),
              "vote_average.lte": ratingMax,
              "vote_count.gte": 10,
            },
          },
        ];

  for (const attempt of attempts) {
    const pagesToTry = [1, 2];
    const collected: TMDbMovie[] = [];
    const seen = new Set<number>();

    for (const page of pagesToTry) {
      const discover = await tmdb<{ results?: TMDbMovie[] }>(
        "/discover/movie",
        { ...attempt.params, page },
        { revalidate: false }
      );

      const results = Array.isArray(discover?.results) ? discover.results : [];

      for (const movie of results) {
        const id = Number(movie?.id);
        if (!Number.isFinite(id)) continue;
        if (excluded.has(id)) continue;
        if (seen.has(id)) continue;

        seen.add(id);
        collected.push(movie);

        if (collected.length >= 30) break;
      }

      if (collected.length >= 30) break;
    }

    if (collected.length) {
      return {
        attempt: attempt.name,
        candidates: collected,
      };
    }
  }

  return {
    attempt: "none",
    candidates: [] as TMDbMovie[],
  };
}

function buildDebugPayload(
  enabled: boolean,
  payload: Record<string, unknown>
): Record<string, unknown> | undefined {
  return enabled ? payload : undefined;
}

export async function GET() {
  return ok({
    ok: true,
    endpoint: "recommendations",
    mode: "structured_mood_hybrid_rules",
    tasteSources: ["favorites_items", "film_feedback", "watchlist_items", "profiles.top_four_ids"],
    supports: {
      feelings: true,
      intentions: true,
      presetKey: true,
      returns: "1 hero recommendation + 3 supporting matches",
    },
  });
}

export async function POST(req: Request) {
  try {
    const token = bearer(req);
    if (!token) {
      return ok({ ok: false, error: "Missing Authorization Bearer token" }, 401);
    }

    const supabase = supabaseAuthed(token);
    const { data: me, error: meErr } = await supabase.auth.getUser();

    if (meErr || !me?.user) {
      return ok({ ok: false, error: "Unauthorized" }, 401);
    }

    const userId = me.user.id;
    const body = await safeJson(req);

    const structuredInput = getStructuredInput(body);
    const hasCoreInput =
      structuredInput.feelings.length > 0 || structuredInput.intentions.length > 0;

    if (!hasCoreInput) {
      return ok(
        {
          ok: false,
          error: "Select at least one feeling or one intention.",
        },
        400
      );
    }

    const region: Region = body.region === "US" ? "US" : "GB";
    const requestedMaxRuntime = clampInt(Number(body.maxRuntime ?? 150), 60, 360);
    const effectiveMaxRuntime = clampInt(requestedMaxRuntime, 60, 360);

    const minRating = clamp(Number(body.minRating ?? 0), 0, 10);
    const maxRating = clamp(Number(body.maxRating ?? 10), 0, 10);
    const ratingMin = Math.min(minRating, maxRating);
    const ratingMax = Math.max(minRating, maxRating);

    const providerIds = uniqInts(body.providerIds, 10);

    const moodSignals = await buildMoodSignals(structuredInput);
    const taste = await buildUserTasteProfile(supabase, userId);

    let genreIds = uniqInts(body.genreIds ?? moodSignals.genreIds, 5);
    if (genreIds.length < 3) {
      genreIds = uniqInts(
        [...genreIds, ...topGenreIds(taste.likedGenres, 3), ...DEFAULT_GENRES],
        5
      );
    }

    const keywordIds = uniqInts(body.keywordIds ?? moodSignals.keywordIds, 5);

    const targetGenreWeights = new Map<number, number>();
    for (const genreId of genreIds) {
      targetGenreWeights.set(genreId, moodSignals.genreScores.get(genreId) ?? 1);
    }

    const found = await discoverWithFallback({
      region,
      maxRuntime: effectiveMaxRuntime,
      ratingMin,
      ratingMax,
      providerIds,
      genres: genreIds,
      keywords: keywordIds,
      excluded: taste.excludedTmdbIds,
    });

    const debugPayload = buildDebugPayload(process.env.NODE_ENV === "development", {
      attempt: found.attempt,
      runtime: {
        requested: requestedMaxRuntime,
        effective: effectiveMaxRuntime,
      },
      mood: {
        ...structuredInput,
        keywordHints: moodSignals.keywordHints,
        genreIds,
        keywordIds,
      },
      filters: {
        providerIds,
        providerFilterActive: providerIds.length > 0,
      },
      personalization: {
        watchedCount: taste.watchedTmdbIds.size,
        savedCount: taste.savedTmdbIds.size,
        excludedCount: taste.excludedTmdbIds.size,
        likedCount: taste.likedTmdbIds.size,
        dislikedCount: taste.dislikedTmdbIds.size,
      },
    });

    const candidates = found.candidates;
    if (!candidates.length) {
      return ok({
        ok: true,
        status: "ready",
        item: null,
        items: [],
        ...(debugPayload ? { debug: debugPayload } : {}),
      });
    }

    const scored = candidates
      .filter((m) => !taste.dislikedTmdbIds.has(Number(m.id)))
      .map((m: TMDbMovie) => ({
        m,
        match: scoreMatchAdvanced(m, targetGenreWeights, taste),
      }))
      .sort((a, b) => b.match - a.match);

    const prelim = scored.slice(0, 12);

    const enriched = await Promise.all(
      prelim.map(async ({ m, match }) => {
        const item: RecoItem = {
          tmdbId: Number(m.id),
          title: String(m.title ?? "Untitled"),
          poster: m.poster_path ? posterUrl(m.poster_path, "w342") : null,
          match: Number(match.toFixed(2)),
          genreIds: Array.isArray(m.genre_ids) ? m.genre_ids : [],
          bestDeal: null,
        };

        try {
          const wp = await tmdb<WatchProvidersResponse>(
            `/movie/${item.tmdbId}/watch/providers`,
            {},
            { revalidate: false }
          );

          const providerMatched = hasSelectedStreamProvider(wp, region, providerIds);
          const deal = bestDeal(wp, region, providerIds);

          const providerBoost =
            providerIds.length > 0 && providerMatched ? 0.12 : 0;

          const streamBoost = deal?.type === "stream" ? 0.03 : 0;

          return {
            ...item,
            bestDeal: deal,
            providerMatched,
            finalMatch: clamp(match + providerBoost + streamBoost, 0, 1),
          };
        } catch {
          return {
            ...item,
            providerMatched: providerIds.length === 0,
            finalMatch: match,
          };
        }
      })
    );

    const ranked =
      providerIds.length > 0
        ? enriched.filter((item) => item.providerMatched)
        : enriched;

    const finalItems = ranked
      .sort((a, b) => b.finalMatch - a.finalMatch)
      .slice(0, 4)
      .map((item) => ({
        tmdbId: item.tmdbId,
        title: item.title,
        poster: item.poster,
        match: Number(item.finalMatch.toFixed(2)),
        genreIds: item.genreIds,
        bestDeal: item.bestDeal,
      }));

    return ok({
      ok: true,
      status: "ready",
      item: finalItems[0] ?? null,
      items: finalItems,
      ...(debugPayload ? { debug: debugPayload } : {}),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return ok({ ok: false, error: message }, 500);
  }
}