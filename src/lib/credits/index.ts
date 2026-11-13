import { currentAccount } from "@/lib/auth/session";
import {
  consumeLocalCredit,
  getLocalCredits,
  refundLocalCredit,
} from "@/lib/credits/local-cookie";
import { consumeSupabaseCredit, readSupabaseBalance, refundSupabaseCredit } from "@/lib/credits/supabase";
import { ACCOUNT_CREDIT_NOTE, type CreditBalance } from "@/lib/credits/types";
import { accountsConfigured } from "@/lib/supabase/env";

export async function resolveCreditSubjectId(): Promise<string | undefined> {
  const account = await currentAccount();
  return account?.id;
}

function emptyAccountBalance(): CreditBalance {
  return {
    remaining: 0,
    source: "supabase",
    label: "Tailorings left",
    note: ACCOUNT_CREDIT_NOTE,
  };
}

export async function readCreditBalance(): Promise<CreditBalance> {
  if (accountsConfigured()) {
    const subjectId = await resolveCreditSubjectId();
    if (!subjectId) return emptyAccountBalance();
    return readSupabaseBalance(subjectId);
  }
  return getLocalCredits();
}

export async function consumeCredit(): Promise<{ ok: boolean; balance: CreditBalance }> {
  if (accountsConfigured()) {
    const subjectId = await resolveCreditSubjectId();
    if (!subjectId) return { ok: false, balance: emptyAccountBalance() };
    return consumeSupabaseCredit(subjectId);
  }
  return consumeLocalCredit();
}

export async function refundCredit(): Promise<CreditBalance> {
  if (accountsConfigured()) {
    const subjectId = await resolveCreditSubjectId();
    if (!subjectId) return emptyAccountBalance();
    return refundSupabaseCredit(subjectId);
  }
  const subjectId = await resolveCreditSubjectId();
  return refundLocalCredit(subjectId);
}
