import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_W342 = "https://image.tmdb.org/t/p/w342";

type TMDbSearchMovie = {
  id?: unknown;
  title?: unknown;
  name?: unknown;
  release_date?: unknown;
  first_air_date?: unknown;
  poster_path?: unknown;
  overview?: unknown;
};

type TMDbSearchResponse = {
  results?: TMDbSearchMovie[];
};

function normalize(movie: TMDbSearchMovie) {
  return {
    tmdbId: Number(movie?.id),
    title: String(movie?.title ?? movie?.name ?? ""),
    year: String(movie?.release_date ?? movie?.first_air_date ?? "").slice(0, 4),
    poster:
      typeof movie?.poster_path === "string"
        ? `${IMG_W342}${movie.poster_path}`
        : "/placeholder-poster.png",
    overview: String(movie?.overview ?? ""),
  };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  // Support both TMDb auth styles:
  // - v3 API key via query string
  // - v4 read token via Bearer header
  const apiKey = process.env.TMDB_API_KEY;
  const readToken =
    process.env.TMDB_READ_TOKEN || process.env.TMDB_API_READ_ACCESS_TOKEN;

  if (!apiKey && !readToken) {
    return NextResponse.json({ error: "TMDB API auth missing" }, { status: 500 });
  }

  const url = new URL(`${TMDB_BASE}/search/movie`);
  url.searchParams.set("query", q);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  if (!readToken && apiKey) {
    url.searchParams.set("api_key", apiKey);
  }

  const res = await fetch(url.toString(), {
    headers: readToken ? { Authorization: `Bearer ${readToken}` } : undefined,
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text();

    return NextResponse.json(
      { error: `TMDb search failed: ${res.status}`, details: text },
      { status: res.status }
    );
  }

  const json = (await res.json()) as TMDbSearchResponse;
  const results = Array.isArray(json?.results)
    ? json.results.map(normalize)
    : [];

  return NextResponse.json({ results });
}