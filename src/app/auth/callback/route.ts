import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth/paths";
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

  let response = NextResponse.redirect(new URL(nextPath, request.url));
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.redirect(new URL(nextPath, request.url));
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, nextCookieOptions(options));
        });
        Object.entries(headers).forEach(([header, value]) => {
          response.headers.set(header, value);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=confirm", request.url));
  }
  return response;
}
