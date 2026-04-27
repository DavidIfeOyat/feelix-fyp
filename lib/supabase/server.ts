import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

type ParsedCookie = {
  name: string;
  value: string;
};

function parseCookieHeader(cookieHeader: string): ParsedCookie[] {
  if (!cookieHeader) return [];

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => {
      const separatorIndex = cookie.indexOf("=");
      const name = separatorIndex >= 0 ? cookie.slice(0, separatorIndex) : cookie;
      const value = separatorIndex >= 0 ? cookie.slice(separatorIndex + 1) : "";

      return { name, value };
    });
}

/**
 * Read-only Supabase client for Server Components.
 * This is safe for pages and layouts that need session-aware reads
 * but cannot write cookies back to the response.
 */
export async function createSupabaseServerReadOnly() {
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie") ?? "";
  const parsedCookies = parseCookieHeader(cookieHeader);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parsedCookies;
        },
        setAll() {
          // Server Components cannot write cookies, so this is intentionally a no-op.
        },
      },
    }
  );
}

/**
 * Writable Supabase client for Server Actions and Route Handlers.
 * This version can persist refreshed auth cookies when the runtime allows it.
 */
export async function createSupabaseServer() {
  const cookieStore: any = await cookies();
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie") ?? "";

  const getAll = () =>
    typeof cookieStore.getAll === "function"
      ? cookieStore.getAll()
      : parseCookieHeader(cookieHeader);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll,
        setAll(cookiesToSet) {
          if (typeof cookieStore.set !== "function") return;

          cookiesToSet.forEach(({ name, value, options }: any) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}