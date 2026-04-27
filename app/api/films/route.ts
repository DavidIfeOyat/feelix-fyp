import { NextResponse } from "next/server";

import { posterUrl, region, tmdb } from "@/lib/tmdb/tmdb";

export const dynamic = "force-dynamic";

const FILMS_PER_PAGE = 40;
const TMDB_PAGE_SIZE = 20;

const GENRE_NAMES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  27: "Horror",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  53: "Thriller",
};

const MOOD_TO_GENRES: Record<string, string | null> = {
  all: null,
  comforting: "10751|16|35|14",
  thrilling: "53|28|9648",
  dark: "80|53|27|9648",
  funny: "35",
  romantic: "10749|35|18",
};

type TMDbListMovie = {
  id?: unknown;
  title?: unknown;
  name?: unknown;
  poster_path?: string | null;
  vote_average?: number | null;
  release_date?: string | null;
  genre_ids?: unknown;
};

type TMDbListResponse = {
  total_pages?: unknown;
  total_results?: unknown;
  results?: TMDbListMovie[];
};

// Build the discover parameter set for mood-led or shelf-led browsing.
function discoverParams(
  list: string,
  mood: string,
  year?: string,
  sort?: string
) {
  const params: Record<string, string> = {
    language: "en-GB",
    region,
    include_adult: "false",
    include_video: "false",
  };

  const withGenres = MOOD_TO_GENRES[mood] ?? null;
  if (withGenres) params.with_genres = withGenres;

  if (year && /^\d{4}$/.test(year)) {
    params.primary_release_year = year;
  }

  const sortMap: Record<string, string> = {
    popularity: "popularity.desc",
    rating: "vote_average.desc",
  };

  if (list === "new") {
    const now = new Date();
    const lte = now.toISOString().slice(0, 10);
    const gteDate = new Date(now);

    gteDate.setDate(gteDate.getDate() - 120);

    params.sort_by = "primary_release_date.desc";
    params["primary_release_date.gte"] = gteDate.toISOString().slice(0, 10);
    params["primary_release_date.lte"] = lte;
  } else if (list === "trending") {
    params.sort_by = "popularity.desc";
    params["vote_count.gte"] = "200";
  } else {
    params.sort_by = sortMap[sort || ""] ?? "popularity.desc";
  }

  return params;
}

// Build the search parameter set for direct title search.
function searchParams(query: string, year?: string) {
  const params: Record<string, string> = {
    language: "en-GB",
    region,
    include_adult: "false",
    query,
  };

  if (year && /^\d{4}$/.test(year)) {
    params.year = year;
  }

  return params;
}

// Map raw TMDb results into the smaller frontend-facing film shape.
function mapMovie(movie: TMDbListMovie) {
  const genreIds = Array.isArray(movie?.genre_ids)
    ? movie.genre_ids
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id))
    : [];

  return {
    tmdbId: Number(movie?.id),
    title: String(movie?.title ?? movie?.name ?? "Untitled"),
    poster: posterUrl(movie?.poster_path, "w500"),
    rating:
      typeof movie?.vote_average === "number" ? movie.vote_average : null,
    year:
      typeof movie?.release_date === "string"
        ? movie.release_date.slice(0, 4)
        : "",
    genres: genreIds.map((id) => GENRE_NAMES[id]).filter(Boolean),
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams: sp } = new URL(req.url);

    const list = (sp.get("list") || "discover").toLowerCase();
    const mood = (sp.get("mood") || "all").toLowerCase();
    const q = sp.get("q") || "";
    const year = sp.get("year") || undefined;
    const sort = sp.get("sort") || undefined;

    // The route accepts a limit parameter, but it is capped to the intended UI page size.
    const requestedLimit = Number(sp.get("limit") || FILMS_PER_PAGE);
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(FILMS_PER_PAGE, Math.floor(requestedLimit)))
      : FILMS_PER_PAGE;

    const rawPage = Number(sp.get("page") || "1");
    const page = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1;

    const isSearch = q.trim().length > 0;
    const path = isSearch ? "/search/movie" : "/discover/movie";
    const params = isSearch
      ? searchParams(q.trim(), year)
      : discoverParams(list, mood, year, sort);

    // Fetch page 1 first so we can calculate the available result range cleanly.
    const meta = await tmdb<TMDbListResponse>(
      path,
      { ...params, page: 1 },
      { revalidate: false }
    );

    const tmdbTotalPages = Math.max(1, Number(meta?.total_pages ?? 1));
    const tmdbTotalResults = Math.max(0, Number(meta?.total_results ?? 0));
    const accessibleResults = Math.min(
      tmdbTotalResults,
      tmdbTotalPages * TMDB_PAGE_SIZE
    );
    const totalPages = Math.max(1, Math.ceil(accessibleResults / limit));

    if (page > totalPages) {
      return NextResponse.json({ items: [], page, totalPages });
    }

    // TMDb only returns 20 results per request, so the API may need to read
    // across multiple TMDb pages to fill a single frontend page cleanly.
    const start = (page - 1) * limit;
    const startTmdbPage = Math.floor(start / TMDB_PAGE_SIZE) + 1;
    const maxPagesToCheck = Math.min(tmdbTotalPages, startTmdbPage + 5);

    const unique: TMDbListMovie[] = [];
    const seen = new Set<number>();

    for (
      let tmdbPage = startTmdbPage;
      tmdbPage <= maxPagesToCheck;
      tmdbPage++
    ) {
      const json =
        tmdbPage === 1
          ? meta
          : await tmdb<TMDbListResponse>(
              path,
              { ...params, page: tmdbPage },
              { revalidate: false }
            );

      const results = Array.isArray(json?.results) ? json.results : [];

      for (const movie of results) {
        const id = Number(movie?.id);
        if (!Number.isFinite(id) || seen.has(id)) continue;

        seen.add(id);
        unique.push(movie);
      }

      if (unique.length >= limit) break;
      if (results.length < TMDB_PAGE_SIZE) break;
    }

    const items = unique.slice(0, limit).map(mapMovie);

    return NextResponse.json({ items, page, totalPages });
  } catch (error: unknown) {
    console.error("api/films error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load films.",
      },
      { status: 500 }
    );
  }
}