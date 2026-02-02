// app/api/recommendations/route.ts
type DealType = "stream" | "rent" | "buy";
type Region = "GB" | "US";

type Item = {
  id: number;
  tmdbId: number;
  title: string;
  runtime?: number | null;
  genres: string[];
  match: number; // 0..1
  bestDeal: { provider: string; type: DealType; region: Region };
  poster: string; // /public path or external URL
};

export async function GET() {
  // Handy sanity check at http://localhost:3000/api/recommendations
  const items = buildItems("GB", 240, {});
  return Response.json({ ok: true, items }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  const body = await safeJson(req);
  const region: Region = body?.region === "US" ? "US" : "GB";
  const maxRuntime = Number(body?.maxRuntime ?? 240);

  const items = buildItems(region, maxRuntime, body);
  return Response.json({ ok: true, items }, { headers: { "cache-control": "no-store" } });
}

/* ---------------- helpers ---------------- */

function buildItems(region: Region, maxRuntime: number, seedObj: unknown): Item[] {
  // Lock literal types with `as const` + `satisfies` to keep DealType strict
  const base = [
    {
      tmdbId: 603,
      title: "The Matrix",
      runtime: 136,
      genres: ["Action", "Sci-Fi"],
      bestDeal: { provider: "Netflix", type: "stream" as const, region },
      poster: poster(0),
    },
    {
      tmdbId: 27205,
      title: "Inception",
      runtime: 148,
      genres: ["Action", "Sci-Fi", "Thriller"],
      bestDeal: { provider: "Prime", type: "rent" as const, region },
      poster: poster(1),
    },
    {
      tmdbId: 13,
      title: "Forrest Gump",
      runtime: 142,
      genres: ["Drama", "Romance"],
      bestDeal: { provider: "Disney+", type: "stream" as const, region },
      poster: poster(2),
    },
    {
      tmdbId: 550,
      title: "Fight Club",
      runtime: 139,
      genres: ["Drama"],
      bestDeal: { provider: "Apple TV", type: "rent" as const, region },
      poster: poster(3),
    },
    {
      tmdbId: 680,
      title: "Pulp Fiction",
      runtime: 154,
      genres: ["Crime", "Drama"],
      bestDeal: { provider: "Paramount+", type: "stream" as const, region },
      poster: poster(4),
    },
  ] satisfies ReadonlyArray<Omit<Item, "id" | "match">>;

  const seed = JSON.stringify(seedObj ?? {});
  const filtered = base.filter(b => (b.runtime ?? 999) <= maxRuntime);

  return filtered
    .map((b, i) => ({
      id: i + 1,
      ...b,
      match: score(seed, b.title), // deterministic 0.60..0.95
    }))
    .sort((a, b) => b.match - a.match);
}

function score(seed: string, title: string): number {
  let h = 0;
  const s = seed + "|" + title;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000;
  return Number((0.6 + (h % 35) / 100).toFixed(2)); // 0.60..0.95
}

function poster(i: number) {
  const local = [
    "/posters/bugonia-poster.jpg",
    "/posters/matrix.jpeg",
    "/posters/inception.jpg",
    "/posters/forrest-gump.jpg",
    "/posters/pulp-fiction.jpg",
  ];
  const fallback = "https://placehold.co/342x513/png?text=feelix";
  return local[i % local.length] ?? fallback;
}

async function safeJson(req: Request) {
  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return {};
  try { return await req.json(); } catch { return {}; }
}
