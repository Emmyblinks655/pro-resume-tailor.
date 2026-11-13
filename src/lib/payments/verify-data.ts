export type ChargeFromVerify = {
  reference: string;
  /** Price to compare with the stored checkout amount. */
  amount: number;
  /** Fee-inclusive amount Paystack collected. */
  chargedAmount: number;
  currency: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function integerAmount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  return value;
}

/**
 * Read a Paystack transaction verify body.
 * When the account passes fees to the customer, `data.amount` includes the fee
 * and `data.requested_amount` is the price we stored. Compare `amount`, and
 * keep the fee-inclusive value as `chargedAmount`.
 */
export function chargeFromVerifyBody(body: unknown, reference: string): ChargeFromVerify | null {
  const envelope = asRecord(body);
  const data = asRecord(envelope?.data);
  if (!envelope || envelope.status !== true || !data || data.status !== "success") return null;
  if (typeof data.reference !== "string" || data.reference !== reference) return null;
  if (typeof data.currency !== "string" || data.currency.trim() === "") return null;

  const chargedAmount = integerAmount(data.amount);
  if (chargedAmount === null) return null;
  const amount = integerAmount(data.requested_amount ?? data.amount);
  if (amount === null) return null;

  return {
    reference,
    amount,
    chargedAmount,
    currency: data.currency.trim().toUpperCase(),
  };
}
