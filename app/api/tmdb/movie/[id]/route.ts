import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_ORIGINAL = "https://image.tmdb.org/t/p/original";

function looksLikeJwt(x?: string | null) {
  return typeof x === "string" && x.split(".").length === 3;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: { id: string } | Promise<{ id: string }> }
) {
  // ✅ Next 15 compatibility: params might be a Promise
  const params = await Promise.resolve(ctx.params as any);
  const raw = String(params?.id ?? "").trim();

  const id = Number(raw);
  if (!raw || !Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id", raw }, { status: 400 });
  }

  // Auth: allow v3 key OR v4 read token (JWT)
  const readToken =
    process.env.TMDB_READ_TOKEN ||
    process.env.TMDB_API_READ_ACCESS_TOKEN ||
    (looksLikeJwt(process.env.TMDB_API_KEY) ? process.env.TMDB_API_KEY : undefined);

  const apiKey = !looksLikeJwt(process.env.TMDB_API_KEY) ? process.env.TMDB_API_KEY : undefined;

  if (!readToken && !apiKey) {
    return NextResponse.json({ error: "TMDB auth missing" }, { status: 500 });
  }

  const url = new URL(`${TMDB_BASE}/movie/${id}`);
  url.searchParams.set("language", "en-US");
  if (!readToken && apiKey) url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString(), {
    headers: readToken ? { Authorization: `Bearer ${readToken}` } : undefined,
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { error: "TMDb fetch failed", status: res.status, details: text },
      { status: res.status }
    );
  }

  const m = await res.json();
  const poster = m?.poster_path ? `${IMG_ORIGINAL}${m.poster_path}` : null;
  const backdrop = m?.backdrop_path ? `${IMG_ORIGINAL}${m.backdrop_path}` : null;

  return NextResponse.json({
    tmdbId: id,
    title: m?.title ?? "",
    poster,
    backdrop,
  });
}