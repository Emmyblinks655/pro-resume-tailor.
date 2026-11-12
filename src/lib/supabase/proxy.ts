import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isProtectedPath, safeNextPath } from "@/lib/auth/paths";
import { accountsConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

const CACHE_HEADERS = ["cache-control", "expires", "pragma"] as const;

function nextCookieOptions(options: CookieOptions) {
  return {
    domain: options.domain,
    expires: options.expires,
    httpOnly: options.httpOnly,
    maxAge: options.maxAge,
    path: options.path,
    sameSite: options.sameSite,
    secure: options.secure,
  };
}

function copySession(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
  for (const header of CACHE_HEADERS) {
    const value = from.headers.get(header);
    if (value) to.headers.set(header, value);
  }
}

/**
 * Refresh the Supabase session and gate /tailor and /dashboard.
 * Next.js 16 runs this from src/proxy.ts (the renamed middleware file).
 */
export async function refreshSession(request: NextRequest) {
  if (!accountsConfigured()) {
    return NextResponse.next({ request });
  }
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) return NextResponse.next({ request });

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, nextCookieOptions(options));
        });
        Object.entries(headers).forEach(([header, value]) => {
          supabaseResponse.headers.set(header, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims.sub === "string" ? data.claims.sub : null;
  if (!userId && isProtectedPath(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    const next = safeNextPath(`${request.nextUrl.pathname}${request.nextUrl.search}`, request.nextUrl.pathname);
    redirectUrl.pathname = "/login";
    redirectUrl.search = `?next=${encodeURIComponent(next)}`;
    const redirectResponse = NextResponse.redirect(redirectUrl);
    copySession(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  return supabaseResponse;
}
