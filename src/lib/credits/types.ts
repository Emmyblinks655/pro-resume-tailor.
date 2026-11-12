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
  source: "local-cookie";
  label: string;
  note: string;
};

/**
 * Ledger seam for a later Supabase adapter.
 *
 * Suggested tables, not created in this scaffold:
 * - credit_balances(subject_id text primary key, remaining int, updated_at timestamptz)
 * - credit_ledger(id uuid primary key, subject_id text, delta int, reason text, pack_id text, created_at timestamptz)
 *
 * Route handlers should keep calling these functions. A Supabase implementation
 * can replace the cookie body once accounts exist, using the auth user id as subjectId.
 */
export interface CreditsRepository {
  getBalance(subjectId: string): Promise<CreditBalance>;
  consumeOne(subjectId: string): Promise<{ ok: boolean; balance: CreditBalance }>;
  grant(subjectId: string, amount: number, reason: CreditReason): Promise<CreditBalance>;
}

export const CREDIT_NOTE =
  "Local preview credits stored in a cookie on this browser. This is not a purchase. Checkout is not live, and nothing renews.";
