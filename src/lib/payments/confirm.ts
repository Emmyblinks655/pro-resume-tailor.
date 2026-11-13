import { verifyPaystackTransaction } from "@/lib/payments/paystack";
import { isPaystackReference, paystackSecret } from "@/lib/payments/paystack-config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PaymentRow = {
  reference: string;
  user_id: string;
  amount_minor: number;
  currency: string;
  credits: number;
  status: string;
};

function asRow(value: unknown): PaymentRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.reference !== "string" ||
    typeof row.user_id !== "string" ||
    typeof row.amount_minor !== "number" ||
    typeof row.currency !== "string" ||
    typeof row.credits !== "number" ||
    typeof row.status !== "string"
  ) {
    return null;
  }
  return {
    reference: row.reference,
    user_id: row.user_id,
    amount_minor: row.amount_minor,
    currency: row.currency.toUpperCase(),
    credits: row.credits,
    status: row.status,
  };
}

/**
 * Verify a Paystack transaction and grant the pack once.
 * A repeated call for the same reference does not add credits again.
 */
export async function confirmPaystackPayment(reference: string): Promise<"success" | "failed"> {
  if (!isPaystackReference(reference)) return "failed";
  const admin = createSupabaseAdminClient();
  const secret = paystackSecret();
  if (!admin || !secret) return "failed";

  const { data, error } = await admin.from("payments").select("reference, user_id, amount_minor, currency, credits, status").eq("reference", reference).maybeSingle();
  if (error) {
    console.error("Payment lookup failed.");
    throw new Error("Payment verification could not finish.");
  }
  const row = asRow(data);
  if (!row) return "failed";
  if (row.status === "success") return "success";
  if (row.status !== "pending") return "failed";

  const charge = await verifyPaystackTransaction(reference, secret);
  if (!charge) return "failed";
  if (charge.amount !== row.amount_minor || charge.currency !== row.currency) {
    await admin.from("payments").update({ status: "failed" }).eq("reference", reference).eq("status", "pending");
    console.error("Paystack amount did not match the stored payment.");
    return "failed";
  }
  if (charge.metadataUserId && charge.metadataUserId !== row.user_id) {
    await admin.from("payments").update({ status: "failed" }).eq("reference", reference).eq("status", "pending");
    console.error("Paystack metadata did not match the stored payment.");
    return "failed";
  }

  const granted = await admin.rpc("apply_successful_payment", {
    p_reference: row.reference,
    p_user_id: row.user_id,
    p_amount_minor: row.amount_minor,
    p_currency: row.currency,
    p_credits: row.credits,
  });
  if (granted.error) {
    console.error("Payment grant failed.");
    throw new Error("Payment verification could not finish.");
  }
  return "success";
}
