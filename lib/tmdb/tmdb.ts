const BASE = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

export type Region = "GB" | "US";
export type ProviderItem = {
  id: number;
  name: string;
  logo: string;
};

export type ProviderGroups = {
  stream: ProviderItem[];
  rent: ProviderItem[];
  buy: ProviderItem[];
  link: string | null;
};

export const region: Region = process.env.TMDB_REGION === "US" ? "US" : "GB";

const READ_TOKEN =
  process.env.TMDB_READ_TOKEN ||
  process.env.TMDB_API_READ_ACCESS_TOKEN ||
  process.env.TMDB_API_READ_TOKEN ||
  "";

const API_KEY = process.env.TMDB_API_KEY || "";

type Params = Record<string, string | number | boolean | undefined | null>;

type TmdbFetchOptions = {
  revalidate?: number | false;
};

function qs(params: Params) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.set(key, String(value));
  }

  return search.toString();
}

export async function tmdb<T = any>(
  path: string,
  params: Params = {},
  options: TmdbFetchOptions = { revalidate: 60 }
): Promise<T> {
  if (!READ_TOKEN && !API_KEY) {
    throw new Error("Missing TMDb credentials. Add TMDB_READ_TOKEN or TMDB_API_KEY.");
  }

  const url = `${BASE}${path}?${qs({
    ...params,
    ...(READ_TOKEN ? {} : { api_key: API_KEY }),
  })}`;

  const res = await fetch(url, {
    headers: READ_TOKEN ? { Authorization: `Bearer ${READ_TOKEN}` } : undefined,
    ...(options.revalidate === false
      ? { cache: "no-store" as const }
      : { next: { revalidate: options.revalidate ?? 60 } }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TMDB ${path} failed: ${res.status} ${text}`);
  }

  return res.json();
}

export function posterUrl(
  path: string | null | undefined,
  size: "w342" | "w500" | "w780" = "w500"
) {
  if (!path) return "/placeholder.svg";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function backdropUrl(
  path: string | null | undefined,
  size: "w780" | "w1280" | "original" = "original"
) {
  if (!path) return "/placeholder.svg";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getCinemaLink(title: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(title)}+showtimes+near+me`;
}

export function getJustWatchSearchLink(title: string, currentRegion: Region = region) {
  return `https://www.justwatch.com/${currentRegion.toLowerCase()}/search?q=${encodeURIComponent(title)}`;
}

export function pickTrailer(videos: any) {
  const list = videos?.results ?? [];
  const youtube = list.filter((item: any) => item?.site === "YouTube");

  const trailer =
    youtube.find((item: any) => item?.type === "Trailer") ||
    youtube.find((item: any) => item?.type === "Teaser") ||
    youtube[0];

  return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
}

export function mapProviders(data: any, currentRegion: Region = region): ProviderGroups {
  const entry = data?.results?.[currentRegion];

  if (!entry) {
    return {
      stream: [],
      rent: [],
      buy: [],
      link: null,
    };
  }

  const toItems = (items: any[] = []): ProviderItem[] =>
    items
      .map((item) => ({
        id: Number(item?.provider_id),
        name: String(item?.provider_name ?? ""),
        logo: posterUrl(item?.logo_path, "w342"),
      }))
      .filter((item) => Number.isFinite(item.id) && item.name.length > 0);

  return {
    stream: toItems(entry.flatrate),
    rent: toItems(entry.rent),
    buy: toItems(entry.buy),
    link: typeof entry.link === "string" ? entry.link : null,
  };
}

export async function getMovie(id: number) {
  return tmdb(`/movie/${id}`, { language: "en-GB" }, { revalidate: 60 });
}

export async function getVideos(id: number) {
  return tmdb(`/movie/${id}/videos`, { language: "en-GB" }, { revalidate: 60 });
}

export async function getWatchProviders(id: number) {
  return tmdb(`/movie/${id}/watch/providers`, {}, { revalidate: 60 });
}