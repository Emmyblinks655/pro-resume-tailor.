import { ACCOUNT_CREDIT_NOTE, type CreditBalance } from "@/lib/credits/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function accountBalance(remaining: number): CreditBalance {
  return {
    remaining,
    source: "supabase",
    label: "Tailorings left",
    note: ACCOUNT_CREDIT_NOTE,
  };
}

function creditResult(data: unknown): { ok: boolean; remaining: number } | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const remaining = typeof record.remaining === "number" ? record.remaining : Number(record.remaining);
  if (typeof record.ok !== "boolean" || !Number.isFinite(remaining)) return null;
  return { ok: record.ok, remaining: Math.max(0, Math.floor(remaining)) };
}

export async function readSupabaseBalance(userId: string): Promise<CreditBalance> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return accountBalance(0);
  const { data, error } = await supabase.from("credit_balances").select("remaining").eq("user_id", userId).maybeSingle();
  if (error) {
    console.error("Credit balance could not be read.");
    return accountBalance(0);
  }
  const remaining = typeof data?.remaining === "number" ? data.remaining : 0;
  return accountBalance(Math.max(0, Math.floor(remaining)));
}

export async function consumeSupabaseCredit(userId: string): Promise<{ ok: boolean; balance: CreditBalance }> {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("The tailor could not finish.");
  const { data, error } = await admin.rpc("consume_credit", { p_user_id: userId });
  if (error) {
    console.error("Credit spend failed.");
    throw new Error("The tailor could not finish.");
  }
  const result = creditResult(data);
  if (!result) throw new Error("The tailor could not finish.");
  return { ok: result.ok, balance: accountBalance(result.remaining) };
}

export async function refundSupabaseCredit(userId: string): Promise<CreditBalance> {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("The tailor could not finish.");
  const { data, error } = await admin.rpc("refund_credit", { p_user_id: userId });
  if (error) {
    console.error("Credit refund failed.");
    throw new Error("The tailor could not finish.");
  }
  const result = creditResult(data);
  if (!result) throw new Error("The tailor could not finish.");
  return accountBalance(result.remaining);
}
