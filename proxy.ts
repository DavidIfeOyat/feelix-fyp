// Route guard for protected pages and auth-entry pages.
// This keeps session-aware redirects close to the edge of the app so that
// users are sent to the right place before page rendering continues.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/films",
  "/watchlist",
  "/group",
  "/profile",
  "/dashboard",
];

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // API routes are handled separately and should not be redirected here.
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (!user && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname + (req.nextUrl.search || ""));
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};