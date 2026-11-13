import { createHmac, timingSafeEqual } from "node:crypto";

export function paystackSignature(rawBody: string, secret: string): string {
  return createHmac("sha512", secret).update(rawBody, "utf8").digest("hex");
}

/** Compare the x-paystack-signature header to the HMAC-SHA512 of the raw body. */
export function paystackSignatureMatches(rawBody: string, secret: string, header: string | null): boolean {
  if (!header) return false;
  const expected = paystackSignature(rawBody, secret);
  const provided = header.trim().toLowerCase();
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(provided, "utf8"));
}
