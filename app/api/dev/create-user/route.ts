import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
}

async function safeJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  // Hard stop in production builds
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    return json({ ok: false, error: "Not found" }, 404);
  }

  const body = await safeJson(req);
  const email = String(body?.email ?? "").trim();
  const password = String(body?.password ?? "");
  const username = String(body?.username ?? "").trim();

  if (!email || !password) {
    return json({ ok: false, error: "email + password required" }, 400);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return json({ ok: false, error: "Missing SUPABASE url/service role key" }, 500);
  }

  const admin = createClient(url, serviceKey);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // ✅ bypass confirmation emails
    user_metadata: { username },
  });

  if (error) return json({ ok: false, error: error.message }, 400);

  return json({ ok: true, userId: data.user?.id });
}