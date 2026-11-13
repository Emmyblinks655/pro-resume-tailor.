const DEFAULT_SITE_URL = "https://proresumetailor.com";

/** Public origin. NEXT_PUBLIC_SITE_URL overrides the production default. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  try {
    const url = new URL(raw);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol === "https:" || (url.protocol === "http:" && local)) return url.origin;
  } catch {
    // Ignore a malformed override and use the production origin.
  }
  return DEFAULT_SITE_URL;
}

/** Browser return URL sent to Paystack on transaction initialize. */
export function paystackCallbackUrl(): string {
  return `${siteUrl()}/api/paystack/callback`;
}
