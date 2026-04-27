import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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
import { posterUrl, tmdb } from "@/lib/tmdb/tmdb";

/**
 * Recommendations are generated dynamically per request, so this route should
 * always run on the server at request time.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Normalised recommendation input after the raw request body has been parsed.
 * This keeps the rest of the route working with a predictable shape.
 */
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

/**
 * Shape returned to the frontend for each recommendation.
 */
type RecoItem = {
  tmdbId: number;
  title: string;
  poster: string | null;
  match: number;
  genreIds: number[];
  bestDeal: { provider: string; type: DealType; region: Region } | null;
};

/**
 * Minimal provider row used when reading TMDb watch provider responses.
 */
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

/**
 * Minimal movie shape used during discovery and scoring.
 */
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

/**
 * Saved row shapes pulled from Supabase. These are intentionally lightweight and
 * only include the fields used by the route.
 */
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

/**
 * Compact internal taste model built from persisted user behaviour.
 */
type UserTasteProfile = {
  watchedTmdbIds: Set<number>;
  savedTmdbIds: Set<number>;
  excludedTmdbIds: Set<number>;
  likedTmdbIds: Set<number>;
  dislikedTmdbIds: Set<number>;
  likedGenres: Map<number, number>;
  dislikedGenres: Map<number, number>;
};

/**
 * Internal TMDb genre IDs used throughout the recommendation logic.
 */
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

/**
 * Fallback genre set used if mood-derived signals are too weak.
 */
const DEFAULT_GENRES = [GENRES.DRAMA, GENRES.THRILLER, GENRES.COMEDY];

/**
 * Feeling-to-genre mapping.
 * This translates emotional input into genre candidates.
 */
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

/**
 * Feeling-to-keyword mapping.
 * These hints are later converted into TMDb keyword IDs where possible.
 */
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

/**
 * Intention-to-genre mapping.
 * Intentions usually carry slightly stronger weight than feelings because they
 * reflect what the user actively wants from the watch.
 */
const INTENTION_GENRES: Record<string, number[]> = {
  "comfort me": [GENRES.COMEDY, GENRES.ROMANCE, GENRES.FAMILY, GENRES.DRAMA],
  "make me laugh": [GENRES.COMEDY, GENRES.FAMILY, GENRES.ADVENTURE],
  "keep me hooked": [
    GENRES.THRILLER,
    GENRES.CRIME,
    GENRES.MYSTERY,
    GENRES.ACTION,
  ],
  "make me think": [
    GENRES.DRAMA,
    GENRES.MYSTERY,
    GENRES.SCI_FI,
    GENRES.DOCUMENTARY,
  ],
  "help me escape": [
    GENRES.ADVENTURE,
    GENRES.FANTASY,
    GENRES.SCI_FI,
    GENRES.COMEDY,
  ],
  "give me romance": [GENRES.ROMANCE, GENRES.COMEDY, GENRES.DRAMA],
  "give me adrenaline": [
    GENRES.ACTION,
    GENRES.THRILLER,
    GENRES.CRIME,
    GENRES.ADVENTURE,
  ],
  "move me emotionally": [GENRES.DRAMA, GENRES.ROMANCE, GENRES.COMEDY],
  "mind-bending": [GENRES.SCI_FI, GENRES.MYSTERY, GENRES.THRILLER],
  heartwarming: [GENRES.FAMILY, GENRES.COMEDY, GENRES.DRAMA],
  "dark and gripping": [
    GENRES.THRILLER,
    GENRES.CRIME,
    GENRES.HORROR,
    GENRES.MYSTERY,
  ],
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

/**
 * Refinement controls also contribute genre weight.
 * These mappings let the route consider pace, darkness, context, and similar
 * values without needing a separate recommendation model.
 */
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

/**
 * Standard JSON response helper used across the route.
 */
function ok(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

/**
 * Extracts a Bearer token from the Authorization header.
 */
function bearer(req: Request) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

/**
 * Create a Supabase client that acts on behalf of the authenticated user.
 * This lets the route read user-specific data without exposing service-role access.
 */
function supabaseAuthed(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !anon) throw new Error("Supabase env missing");

  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/**
 * Parse the request body safely. If parsing fails, return an empty object
 * instead of throwing before validation can run.
 */
function safeJson(req: Request): Promise<Record<string, unknown>> {
  return req
    .json()
    .then((body) => body as Record<string, unknown>)
    .catch(() => ({}));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function clampInt(n: number, min: number, max: number) {
  const v = Math.trunc(Number(n));
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

/**
 * Lowercase, trim, and collapse spacing so matching stays consistent.
 */
function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Return unique integers from an unknown array-like value.
 */
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

/**
 * Return unique normalised strings up to the requested limit.
 */
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

/**
 * Safely parse an enum-like value from request input.
 */
function parseEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  const normalized = normalizeText(String(value ?? ""));
  return allowed.find((item) => normalizeText(item) === normalized) ?? fallback;
}

/**
 * Add weighted genre preference into a running score map.
 */
function addWeightedGenres(
  target: Map<number, number>,
  genreIds: number[],
  weight: number
) {
  for (const genreId of genreIds) {
    target.set(genreId, (target.get(genreId) ?? 0) + weight);
  }
}

/**
 * Return the top N genres from a weighted score map.
 */
function topGenreIds(scores: Map<number, number>, limit: number) {
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([genreId]) => genreId)
    .slice(0, limit);
}

/**
 * Build a flat keyword hint list from selected input keys.
 */
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

/**
 * Flatten provider groups for a region into a single list.
 */
function providerEntries(wp: WatchProvidersResponse, region: Region): ProviderEntry[] {
  const r = wp?.results?.[region];
  if (!r) return [];

  const read = (
    rows: ProviderRow[] | undefined,
    type: DealType
  ): ProviderEntry[] => {
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

/**
 * Check whether the selected stream providers include a match for the film.
 */
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

/**
 * Pick the most useful provider to show to the frontend.
 * Preference order:
 * 1. selected stream provider
 * 2. selected provider of any type
 * 3. first stream provider
 * 4. first available provider
 */
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
            entry.type === "stream" &&
            preferredProviderIds.includes(entry.providerId)
        ) ?? entries.find((entry) => preferredProviderIds.includes(entry.providerId))
      : null;

  const chosen =
    preferred ?? entries.find((entry) => entry.type === "stream") ?? entries[0];

  return {
    provider: chosen.provider,
    type: chosen.type,
    region,
  };
}

/**
 * Convert free-text keyword hints into TMDb keyword IDs.
 */
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

/**
 * Resolve multiple keyword hints and merge them into one unique keyword ID list.
 */
async function keywordIdsFromHints(hints: string[]) {
  const uniqueHints = uniqStrings(hints, 5);
  if (!uniqueHints.length) return [];

  const all = await Promise.all(
    uniqueHints.map((hint) => keywordIdsFromTmdb(hint))
  );

  return uniqInts(all.flat(), 5);
}

/**
 * Extract a TMDb ID from a saved row regardless of which column currently holds it.
 */
function extractTmdbId(row: {
  tmdb_id?: unknown;
  external_id?: unknown;
  payload?: FavoriteRow["payload"] | WatchlistRow["payload"];
}) {
  const raw = row.tmdb_id ?? row.payload?.tmdbId ?? row.external_id;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

/**
 * Pull stored genre IDs from a saved payload where available.
 */
function extractGenreIdsFromPayload(
  payload: FavoriteRow["payload"] | WatchlistRow["payload"]
) {
  return uniqInts(payload?.genreIds ?? payload?.genre_ids ?? [], 20);
}

/**
 * Build a stable lookup key for feedback rows. This lets the route match rows
 * whether the record is keyed by TMDb ID or by an external ID string.
 */
function feedbackKey(tmdbId: number | null, externalId: unknown) {
  const external = String(externalId ?? "").trim();
  if (tmdbId !== null) return `tmdb:${tmdbId}`;
  if (external) return `ext:${external}`;
  return null;
}

/**
 * Fetch genre metadata for films that do not already have genre IDs saved locally.
 */
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

/**
 * Queue pending genre weights for films whose genres need to be looked up later.
 */
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

/**
 * Build a lightweight taste profile from persisted user state.
 * This route deliberately combines favourites, watchlist, explicit feedback,
 * and top-four selections rather than relying on a single signal source.
 */
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

  /**
   * Normalise explicit feedback into a single map so later passes can check
   * whether a favourite should really count as liked or disliked.
   */
  const feedbackStateByKey = new Map<string, boolean>();

  for (const row of feedbackRows) {
    const tmdbId = extractTmdbId(row);
    const key = feedbackKey(tmdbId, row.external_id);

    if (key !== null) feedbackStateByKey.set(key, Boolean(row.liked));
    if (tmdbId !== null) feedbackStateByKey.set(`tmdb:${tmdbId}`, Boolean(row.liked));

    const external = String(row.external_id ?? "").trim();
    if (external) feedbackStateByKey.set(`ext:${external}`, Boolean(row.liked));
  }

  /**
   * For some saved rows, genre IDs may not exist in the local payload.
   * These are queued and enriched later via TMDb.
   */
  const queuedGenreWeights = new Map<number, { liked: number; disliked: number }>();

  /**
   * Watchlist items are treated as softer positive intent signals.
   */
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

  /**
   * Mount Rushmore selections are treated as very strong positive preference signals.
   */
  for (const tmdbId of topFourIds) {
    likedTmdbIds.add(tmdbId);
    queueGenreWeight(queuedGenreWeights, tmdbId, "liked", 4.5);
  }

  /**
   * Favourites are stronger than watchlist items.
   * If explicit feedback says a favourite was disliked, that override is respected.
   */
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

  /**
   * Explicit feedback is treated as the strongest behavioural signal.
   */
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

  /**
   * Enrich queued film IDs with real TMDb genres when those genres were not
   * already stored locally.
   */
  const lookedUpGenres = await fetchGenresForMovieIds([
    ...queuedGenreWeights.keys(),
  ]);

  for (const [tmdbId, weights] of queuedGenreWeights.entries()) {
    const genreIds = lookedUpGenres.get(tmdbId) ?? [];
    if (!genreIds.length) continue;

    if (weights.liked > 0) addWeightedGenres(likedGenres, genreIds, weights.liked);
    if (weights.disliked > 0) {
      addWeightedGenres(dislikedGenres, genreIds, weights.disliked);
    }
  }

  /**
   * Saved or already-watched films are excluded from fresh recommendation results.
   */
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

/**
 * Score a candidate film against:
 * - current mood / intent targets
 * - historical liked genres
 * - historical disliked genres
 * - basic quality and popularity signals
 */
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

/**
 * Parse and normalise the incoming request body into the route's structured input.
 * Presets can fill in missing values when the request does not specify them directly.
 */
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
    if (input.feelings.length === 0) {
      input.feelings = uniqStrings(preset.feelings, 3);
    }
    if (input.intentions.length === 0) {
      input.intentions = uniqStrings(preset.intentions, 2);
    }
    if (!String(body.energy ?? "").trim()) input.energy = preset.energy;
    if (!String(body.pace ?? "").trim()) input.pace = preset.pace;
    if (!String(body.intensity ?? "").trim()) input.intensity = preset.intensity;
    if (!String(body.darkness ?? "").trim()) input.darkness = preset.darkness;
    if (!String(body.brainpower ?? "").trim()) {
      input.brainpower = preset.brainpower;
    }
    if (!String(body.watchContext ?? "").trim()) {
      input.watchContext = preset.watchContext;
    }
  }

  return input;
}

/**
 * Convert mood input into weighted recommendation signals:
 * - genre scores
 * - keyword hints
 * - TMDb keyword IDs
 */
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

  /**
   * Add extra keyword hints from refinement controls.
   */
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

/**
 * Discover candidate films from TMDb using progressively relaxed filters.
 * This reduces empty-result cases when the initial query is too strict.
 */
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
  const {
    region,
    maxRuntime,
    ratingMin,
    ratingMax,
    providerIds,
    genres,
    keywords,
    excluded,
  } = opts;

  const attempts: Array<{
    name: string;
    params: Record<string, string | number | undefined>;
  }> =
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

/**
 * Only return detailed debug metadata in development.
 */
function buildDebugPayload(
  enabled: boolean,
  payload: Record<string, unknown>
): Record<string, unknown> | undefined {
  return enabled ? payload : undefined;
}

/**
 * Simple metadata endpoint for testing/documentation.
 */
export async function GET() {
  return ok({
    ok: true,
    endpoint: "recommendations",
    mode: "structured_mood_hybrid_rules",
    tasteSources: [
      "favorites_items",
      "film_feedback",
      "watchlist_items",
      "profiles.top_four_ids",
    ],
    supports: {
      feelings: true,
      intentions: true,
      presetKey: true,
      returns: "1 hero recommendation + 3 supporting matches",
    },
  });
}

/**
 * Main recommendation endpoint.
 */
export async function POST(req: Request) {
  try {
    /**
     * 1. Authenticate the request.
     */
    const token = bearer(req);
    if (!token) {
      return ok({ ok: false, error: "Missing Authorization Bearer token" }, 401);
    }

    const supabase = supabaseAuthed(token);
    const { data: me, error: meErr } = await supabase.auth.getUser();

    if (meErr || !me?.user) {
      return ok({ ok: false, error: "Unauthorized" }, 401);
    }

    /**
     * 2. Parse and validate request input.
     */
    const userId = me.user.id;
    const body = await safeJson(req);

    const structuredInput = getStructuredInput(body);
    const hasCoreInput =
      structuredInput.feelings.length > 0 ||
      structuredInput.intentions.length > 0;

    if (!hasCoreInput) {
      return ok(
        {
          ok: false,
          error: "Select at least one feeling or one intention.",
        },
        400
      );
    }

    /**
     * 3. Read filters and bounds from the request.
     */
    const region: Region = body.region === "US" ? "US" : "GB";
    const requestedMaxRuntime = clampInt(Number(body.maxRuntime ?? 150), 60, 360);
    const effectiveMaxRuntime = clampInt(requestedMaxRuntime, 60, 360);

    const minRating = clamp(Number(body.minRating ?? 0), 0, 10);
    const maxRating = clamp(Number(body.maxRating ?? 10), 0, 10);
    const ratingMin = Math.min(minRating, maxRating);
    const ratingMax = Math.max(minRating, maxRating);

    const providerIds = uniqInts(body.providerIds, 10);

    /**
     * 4. Build current mood signals and historical taste signals.
     */
    const moodSignals = await buildMoodSignals(structuredInput);
    const taste = await buildUserTasteProfile(supabase, userId);

    /**
     * 5. Finalise target genres and keyword IDs.
     * If mood signals are weak, blend in liked genres and fallback defaults.
     */
    let genreIds = uniqInts(body.genreIds ?? moodSignals.genreIds, 5);
    if (genreIds.length < 3) {
      genreIds = uniqInts(
        [...genreIds, ...topGenreIds(taste.likedGenres, 3), ...DEFAULT_GENRES],
        5
      );
    }

    const keywordIds = uniqInts(body.keywordIds ?? moodSignals.keywordIds, 5);

    /**
     * 6. Build weighted genre targets used by the scoring stage.
     */
    const targetGenreWeights = new Map<number, number>();
    for (const genreId of genreIds) {
      targetGenreWeights.set(genreId, moodSignals.genreScores.get(genreId) ?? 1);
    }

    /**
     * 7. Discover candidates from TMDb using fallback logic.
     */
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

    /**
     * 8. Attach debug details in development only.
     */
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

    /**
     * 9. Score and rank candidates.
     * Explicitly disliked items are removed before scoring.
     */
    const scored = candidates
      .filter((m) => !taste.dislikedTmdbIds.has(Number(m.id)))
      .map((m: TMDbMovie) => ({
        m,
        match: scoreMatchAdvanced(m, targetGenreWeights, taste),
      }))
      .sort((a, b) => b.match - a.match);

    /**
     * 10. Take the strongest initial pool for provider enrichment.
     */
    const prelim = scored.slice(0, 12);

    /**
     * 11. Enrich each item with provider data and give a small score boost
     * when the film matches the user's selected providers.
     */
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
          /**
           * Provider enrichment should not fail the whole request.
           * Fall back to the original match score if provider lookup fails.
           */
          return {
            ...item,
            providerMatched: providerIds.length === 0,
            finalMatch: match,
          };
        }
      })
    );

    /**
     * 12. If provider filters were selected, keep only provider-matching items.
     */
    const ranked =
      providerIds.length > 0
        ? enriched.filter((item) => item.providerMatched)
        : enriched;

    /**
     * 13. Return the final top four recommendations.
     */
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
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return ok({ ok: false, error: message }, 500);
  }
}