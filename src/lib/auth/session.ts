import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthAccount = {
  id: string;
  email: string | null;
};

export async function currentAccount(): Promise<AuthAccount | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  const subject = data.claims.sub;
  if (typeof subject !== "string" || !subject) return null;
  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  return { id: subject, email };
}
