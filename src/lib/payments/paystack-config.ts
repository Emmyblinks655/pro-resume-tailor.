import { PACK_PRICE_MINOR } from "@/lib/packs";
import { paystackCallbackUrl } from "@/lib/site";

export const DEFAULT_PAYSTACK_CURRENCY = "NGN";
export const DEFAULT_PRICE_AMOUNT_MINOR = PACK_PRICE_MINOR;

const REFERENCE = /^[A-Za-z0-9_-]{8,100}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAYSTACK_HOSTS = new Set(["checkout.paystack.com", "paystack.com"]);

export function paystackSecret(): string | null {
  const value = process.env.PAYSTACK_SECRET_KEY?.trim();
  return value || null;
}

export function paystackPublicKey(): string | null {
  const value = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim();
  return value || null;
}

export function paystackCurrency(): string {
  const raw = (process.env.PAYSTACK_CURRENCY ?? DEFAULT_PAYSTACK_CURRENCY).trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(raw)) return DEFAULT_PAYSTACK_CURRENCY;
  return raw;
}

export function priceAmountMinor(): number {
  const raw = process.env.PRICE_AMOUNT_MINOR?.trim();
  if (!raw) return DEFAULT_PRICE_AMOUNT_MINOR;
  if (!/^\d+$/.test(raw)) return DEFAULT_PRICE_AMOUNT_MINOR;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 100 || value > 100_000_000) return DEFAULT_PRICE_AMOUNT_MINOR;
  return value;
}

/** Both Paystack keys must be present before checkout leaves this site. */
export function paystackReady(): boolean {
  return Boolean(paystackSecret() && paystackPublicKey());
}

export function isPaystackReference(value: string): boolean {
  return REFERENCE.test(value);
}

export function isAccountId(value: string): boolean {
  return UUID.test(value);
}

export function isCheckoutEmail(value: string): boolean {
  return EMAIL.test(value) && value.length <= 320;
}

export function createPaystackReference(): string {
  return `prt_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function paystackAuthorizationUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !PAYSTACK_HOSTS.has(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function checkoutFallbackPath(signedIn: boolean): string {
  return signedIn ? "/dashboard" : "/signup?next=/pricing";
}

export function paymentRedirectPath(status: "success" | "failed"): string {
  return `/dashboard?payment=${status}`;
}

export { paystackCallbackUrl };
