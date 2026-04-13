import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

function parseCookieHeader(cookieHeader: string) {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const i = c.indexOf("=");
      const name = i >= 0 ? c.slice(0, i) : c;
      const value = i >= 0 ? c.slice(i + 1) : "";
      return { name, value };
    });
}

/**
 * ✅ Server Components (NavBar, pages): SAFE (read-only, no cookie writes)
 */
export async function createSupabaseServerReadOnly() {
  const h = await headers();
  const cookieHeader = h.get("cookie") ?? "";
  const all = parseCookieHeader(cookieHeader);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return all;
        },
        setAll() {
          // no-op: Server Components cannot set cookies
        },
      },
    }
  );
}

/**
 * ✅ Server Actions / Route Handlers: ALLOWED to set cookies
 */
export async function createSupabaseServer() {
  const cookieStore: any = await cookies();
  const h = await headers();
  const cookieHeader = h.get("cookie") ?? "";

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
