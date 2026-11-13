import { createClient } from "@supabase/supabase-js";

import { supabaseUrl } from "@/lib/supabase/env";

/** Server-only. Never prefix this with NEXT_PUBLIC_. */
export function serviceRoleKey(): string | null {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return value || null;
}

export function creditsStoreConfigured(): boolean {
  return Boolean(supabaseUrl() && serviceRoleKey());
}

export function createSupabaseAdminClient() {
  const url = supabaseUrl();
  const key = serviceRoleKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
