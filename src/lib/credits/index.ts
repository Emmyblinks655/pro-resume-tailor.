import { currentAccount } from "@/lib/auth/session";
import {
  consumeLocalCredit,
  getLocalCredits,
  localCookieCredits,
  refundLocalCredit,
} from "@/lib/credits/local-cookie";
import type { CreditBalance } from "@/lib/credits/types";

export async function resolveCreditSubjectId(): Promise<string | undefined> {
  const account = await currentAccount();
  return account?.id;
}

export async function readCreditBalance(): Promise<CreditBalance> {
  const subjectId = await resolveCreditSubjectId();
  if (subjectId) return localCookieCredits.getBalance(subjectId);
  return getLocalCredits();
}

export async function consumeCredit(): Promise<{ ok: boolean; balance: CreditBalance }> {
  const subjectId = await resolveCreditSubjectId();
  if (subjectId) return localCookieCredits.consumeOne(subjectId);
  return consumeLocalCredit();
}

export async function refundCredit(): Promise<CreditBalance> {
  const subjectId = await resolveCreditSubjectId();
  return refundLocalCredit(subjectId);
}
