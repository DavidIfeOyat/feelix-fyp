// app/api/db-smoke/route.ts
import { getServerSession } from "next-auth/next";      // ✅ App Router version
import { authOptions } from "../../../lib/auth";        // ✅ from lib, NOT from an API route
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET() {
  // cast away type noise so TS doesn’t block you
  const session: any = await getServerSession(authOptions as any);
  const userId: string | undefined = session?.user?.id;

  if (!userId) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("films")
    .select("id, tmdb_id, title, age_rating")
    .limit(5);

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true, userId, films: data ?? [] });
}
