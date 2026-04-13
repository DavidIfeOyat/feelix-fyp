import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_W342 = "https://image.tmdb.org/t/p/w342";

const normalize = (m: any) => ({
  tmdbId: m.id,
  title: m.title ?? m.name ?? "",
  year: String(m.release_date ?? m.first_air_date ?? "").slice(0, 4),
  poster: m.poster_path ? `${IMG_W342}${m.poster_path}` : "/placeholder-poster.png",
  overview: m.overview ?? "",
});

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (!q) return NextResponse.json({ results: [] });

  // Support BOTH auth styles:
  const apiKey = process.env.TMDB_API_KEY; // v3 key
  const readToken =
    process.env.TMDB_READ_TOKEN || process.env.TMDB_API_READ_ACCESS_TOKEN; // v4 read token (Bearer)

  if (!apiKey && !readToken) {
    return NextResponse.json({ error: "TMDB API auth missing" }, { status: 500 });
  }

  const url = new URL(`${TMDB_BASE}/search/movie`);
  url.searchParams.set("query", q);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  // If you only have v3 key, use api_key param
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

  const j = await res.json();
  const results = Array.isArray(j?.results) ? j.results.map(normalize) : [];
  return NextResponse.json({ results });
}