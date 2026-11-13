import { getPack } from "@/lib/packs";
import {
  createPaystackReference,
  isAccountId,
  isCheckoutEmail,
  isPaystackReference,
  paystackAuthorizationUrl,
  paystackCallbackUrl,
  paystackCurrency,
  paystackPublicKey,
  paystackReady,
  paystackSecret,
  priceAmountMinor,
} from "@/lib/payments/paystack-config";
import type { CheckoutRequest, CheckoutResult, PaymentProvider } from "@/lib/payments/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PaystackCall = {
  status: number;
  body: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

async function paystackCall(path: string, secret: string, init?: RequestInit): Promise<PaystackCall> {
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  return { status: response.status, body };
}

export type VerifiedCharge = {
  reference: string;
  amount: number;
  currency: string;
  metadataUserId: string | null;
};

export async function verifyPaystackTransaction(reference: string, secret: string): Promise<VerifiedCharge | null> {
  if (!isPaystackReference(reference)) return null;
  const result = await paystackCall(`/transaction/verify/${encodeURIComponent(reference)}`, secret);
  if (result.status >= 500) {
    throw new Error("Payment verification could not finish.");
  }
  if (result.status !== 200) return null;
  const envelope = asRecord(result.body);
  const data = asRecord(envelope?.data);
  if (envelope?.status !== true || data?.status !== "success") return null;
  const amount = data.amount;
  const currency = data.currency;
  const returned = data.reference;
  if (typeof amount !== "number" || !Number.isInteger(amount)) return null;
  if (typeof currency !== "string" || typeof returned !== "string") return null;
  if (returned !== reference) return null;
  const metadata = asRecord(data.metadata);
  const metadataUserId = typeof metadata?.user_id === "string" ? metadata.user_id : null;
  return {
    reference,
    amount,
    currency: currency.toUpperCase(),
    metadataUserId,
  };
}

async function markPaymentFailed(reference: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) return;
  await admin.from("payments").update({ status: "failed" }).eq("reference", reference).eq("status", "pending");
}

export async function startPaystackCheckout(input: { packId: string; userId: string; email: string }): Promise<string> {
  const pack = getPack(input.packId);
  const secret = paystackSecret();
  const admin = createSupabaseAdminClient();
  if (!pack || !secret || !paystackPublicKey() || !admin) {
    throw new Error("Checkout could not start.");
  }
  if (!isAccountId(input.userId) || !isCheckoutEmail(input.email)) {
    throw new Error("Checkout could not start.");
  }
  const reference = createPaystackReference();
  const amount = priceAmountMinor();
  const currency = paystackCurrency();
  const { error: insertError } = await admin.from("payments").insert({
    reference,
    user_id: input.userId,
    pack_id: pack.id,
    amount_minor: amount,
    currency,
    credits: pack.credits,
    status: "pending",
  });
  if (insertError) {
    console.error("Payment row could not be saved.");
    throw new Error("Checkout could not start.");
  }

  let authorizationUrl: string | null = null;
  try {
    const result = await paystackCall("/transaction/initialize", secret, {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        amount,
        currency,
        reference,
        callback_url: paystackCallbackUrl(),
        metadata: {
          user_id: input.userId,
          pack_id: pack.id,
          credits: pack.credits,
        },
      }),
    });
    const data = asRecord(asRecord(result.body)?.data);
    const returned = typeof data?.reference === "string" ? data.reference : "";
    authorizationUrl = result.status === 200 && returned === reference ? paystackAuthorizationUrl(data?.authorization_url) : null;
    if (!authorizationUrl) {
      console.error("Paystack initialize did not return a checkout URL.", result.status);
    }
  } catch (error) {
    console.error("Paystack initialize failed.", error);
    authorizationUrl = null;
  }

  if (!authorizationUrl) {
    await markPaymentFailed(reference);
    throw new Error("Checkout could not start.");
  }
  return authorizationUrl;
}

export const paystackProvider: PaymentProvider = {
  id: "paystack",
  label: "Paystack",
  async createCheckout(input: CheckoutRequest): Promise<CheckoutResult> {
    if (!input.userId || !input.email || !paystackReady() || !getPack(input.packId)) {
      return { provider: "paystack", status: "unavailable", packId: input.packId, url: null };
    }
    const url = await startPaystackCheckout({
      packId: input.packId,
      userId: input.userId,
      email: input.email,
    });
    return { provider: "paystack", status: "redirect", packId: input.packId, url };
  },
};
