import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth/paths";
import { fullNameFromRow, needsOnboarding, withOnboarding } from "@/lib/auth/profile";
import { accountsConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

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

export async function GET(request: NextRequest) {
  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));
  if (!accountsConfigured()) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  const code = request.nextUrl.searchParams.get("code");
  if (!url || !key || !code) {
    return NextResponse.redirect(new URL("/login?error=confirm", request.url));
  }

  let destination = nextPath;
  let pendingCookies: { name: string; value: string; options: CookieOptions }[] = [];
  let pendingHeaders: Record<string, string> = {};

  const applySession = (target: NextResponse) => {
    pendingCookies.forEach(({ name, value, options }) => {
      target.cookies.set(name, value, nextCookieOptions(options));
    });
    Object.entries(pendingHeaders).forEach(([header, value]) => {
      target.headers.set(header, value);
    });
  };

  let response = NextResponse.redirect(new URL(destination, request.url));
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        pendingCookies = cookiesToSet;
        pendingHeaders = headers;
        response = NextResponse.redirect(new URL(destination, request.url));
        applySession(response);
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=confirm", request.url));
  }

  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims.sub === "string" ? data.claims.sub : null;
  if (!userId) return response;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) return response;

  destination = withOnboarding(nextPath, needsOnboarding(fullNameFromRow(profile)));
  if (destination === nextPath) return response;

  const redirected = NextResponse.redirect(new URL(destination, request.url));
  applySession(redirected);
  for (const header of ["cache-control", "expires", "pragma"] as const) {
    const value = response.headers.get(header);
    if (value) redirected.headers.set(header, value);
  }
  return redirected;
}
