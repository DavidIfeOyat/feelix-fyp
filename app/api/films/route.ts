import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("films")
    .select("id, tmdb_id, title, age_rating, runtime, genres")
    .order("id", { ascending: true })
    .limit(12);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  // Helpful caching while developing (disable if you like)
  return new Response(JSON.stringify({ ok: true, rows: data ?? [] }), {
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}
