import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export async function createSupabaseServerClient() {
  if (!accountsConfigured()) return null;
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) return null;
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, nextCookieOptions(options));
          });
        } catch {
          // Server Components cannot write cookies. src/proxy.ts refreshes the session.
        }
      },
    },
  });
}
