import { connection } from "next/server";

import { profileFromRow, type OwnProfile } from "@/lib/auth/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function rowFromUnknown(data: unknown): { email?: unknown; full_name?: unknown; headline?: unknown } | null {
  if (!data || typeof data !== "object") return null;
  return data as { email?: unknown; full_name?: unknown; headline?: unknown };
}

export async function readOwnProfile(userId: string, fallbackEmail: string | null): Promise<OwnProfile> {
  await connection();
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: "unavailable", email: fallbackEmail, fullName: null, headline: null };
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("email, full_name, headline")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    return { status: "unavailable", email: fallbackEmail, fullName: null, headline: null };
  }
  return profileFromRow(rowFromUnknown(data), fallbackEmail);
}
