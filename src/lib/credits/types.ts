import { PACK_PRICE_LABEL } from "@/lib/packs";

export type CreditReason = "seed" | "tailor" | "refund" | "grant";

export type CreditLedgerEntry = {
  id: string;
  subjectId: string;
  delta: number;
  reason: CreditReason;
  source: "local-cookie" | "supabase";
  createdAt: string;
};

export type StoredCredits = {
  subjectId: string;
  remaining: number;
  entries: CreditLedgerEntry[];
};

export type CreditBalance = {
  remaining: number;
  source: "local-cookie" | "supabase";
  label: string;
  note: string;
};

/**
 * Signed-in balances live in public.credit_balances.
 * The cookie ledger remains only when Supabase accounts are not configured.
 */
export interface CreditsRepository {
  getBalance(subjectId: string): Promise<CreditBalance>;
  consumeOne(subjectId: string): Promise<{ ok: boolean; balance: CreditBalance }>;
  grant(subjectId: string, amount: number, reason: CreditReason): Promise<CreditBalance>;
}

export const CREDIT_NOTE =
  `Tailorings left on this browser. Buy five more for ${PACK_PRICE_LABEL} whenever you need them. Nothing renews.`;

export const ACCOUNT_CREDIT_NOTE =
  `Buy five more for ${PACK_PRICE_LABEL} whenever you need them. Nothing renews.`;
