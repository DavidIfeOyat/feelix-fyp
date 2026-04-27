import { NextRequest, NextResponse } from "next/server";

/**
 * Base TMDb API endpoint used to fetch a single film by ID.
 */
const TMDB_BASE = "https://api.themoviedb.org/3";

/**
 * Original-size image base URL used to build poster and backdrop links.
 */
const IMG_ORIGINAL = "https://image.tmdb.org/t/p/original";

/**
 * Route context type for the dynamic [id] segment.
 * In newer Next.js versions, params can arrive either directly or as a Promise.
 */
type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

/**
 * Minimal subset of the TMDb movie response used by this route.
 * Unknown is used first so values can be checked safely before use.
 */
type TMDbMovieDetailsResponse = {
  title?: unknown;
  poster_path?: unknown;
  backdrop_path?: unknown;
};

/**
 * Small helper to detect whether an environment value looks like a JWT.
 * This is useful because TMDb v4 read tokens look like JWTs,
 * while v3 API keys do not.
 */
function looksLikeJwt(value?: string | null) {
  return typeof value === "string" && value.split(".").length === 3;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  /**
   * Next.js route params may be wrapped in a Promise,
   * so resolve them safely before reading the id.
   */
  const params = await Promise.resolve(ctx.params);
  const raw = String(params?.id ?? "").trim();

  /**
   * Convert the raw route parameter into a numeric TMDb ID.
   * Reject invalid or missing values early.
   */
  const id = Number(raw);
  if (!raw || !Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id", raw }, { status: 400 });
  }

  /**
   * Support both TMDb auth styles:
   * - v4 Bearer read token
   * - older v3 API key
   *
   * If TMDB_API_KEY happens to actually contain a JWT-like token,
   * treat it as a read token instead.
   */
  const readToken =
    process.env.TMDB_READ_TOKEN ||
    process.env.TMDB_API_READ_ACCESS_TOKEN ||
    (looksLikeJwt(process.env.TMDB_API_KEY)
      ? process.env.TMDB_API_KEY
      : undefined);

  const apiKey = !looksLikeJwt(process.env.TMDB_API_KEY)
    ? process.env.TMDB_API_KEY
    : undefined;

  /**
   * Fail fast if no TMDb credentials are configured.
   */
  if (!readToken && !apiKey) {
    return NextResponse.json({ error: "TMDB auth missing" }, { status: 500 });
  }

  /**
   * Build the TMDb request URL for the selected film.
   */
  const url = new URL(`${TMDB_BASE}/movie/${id}`);
  url.searchParams.set("language", "en-US");

  /**
   * Only add api_key as a query parameter when no Bearer token is available.
   */
  if (!readToken && apiKey) {
    url.searchParams.set("api_key", apiKey);
  }

  /**
   * Fetch the film from TMDb.
   * Revalidate every 5 minutes to reduce repeated external requests.
   */
  const res = await fetch(url.toString(), {
    headers: readToken ? { Authorization: `Bearer ${readToken}` } : undefined,
    next: { revalidate: 300 },
  });

  /**
   * If TMDb returns an error, pass that back with some detail for debugging.
   */
  if (!res.ok) {
    const text = await res.text().catch(() => "");

    return NextResponse.json(
      { error: "TMDb fetch failed", status: res.status, details: text },
      { status: res.status }
    );
  }

  /**
   * Read the response body and narrow the fields safely before using them.
   */
  const movie = (await res.json()) as TMDbMovieDetailsResponse;

  /**
   * Build full image URLs only when TMDb returned valid image paths.
   */
  const poster =
    typeof movie?.poster_path === "string"
      ? `${IMG_ORIGINAL}${movie.poster_path}`
      : null;

  const backdrop =
    typeof movie?.backdrop_path === "string"
      ? `${IMG_ORIGINAL}${movie.backdrop_path}`
      : null;

  /**
   * Return a smaller, app-friendly response instead of the full TMDb payload.
   * This keeps the client-side code simpler and avoids exposing unnecessary data.
   */
  return NextResponse.json({
    tmdbId: id,
    title: typeof movie?.title === "string" ? movie.title : "",
    poster,
    backdrop,
  });
}