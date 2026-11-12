import type { NextRequest } from "next/server";

import { readTokenEncryptionKey } from "@/lib/crypto/secret-box";

export function linkedInClientId(): string | null {
  const value = process.env.LINKEDIN_CLIENT_ID?.trim();
  return value || null;
}

export function linkedInClientSecret(): string | null {
  const value = process.env.LINKEDIN_CLIENT_SECRET?.trim();
  return value || null;
}

export function linkedInAppConfigured(): boolean {
  return Boolean(linkedInClientId() && linkedInClientSecret());
}

export function tokenEncryptionReady(): boolean {
  return readTokenEncryptionKey() !== null;
}

export function linkedInConnectReady(): boolean {
  return linkedInAppConfigured() && tokenEncryptionReady();
}

/**
 * LinkedIn has rejected `code_challenge` together with the openid scope for some apps
 * ("Open ID permission is not supported for PKCE flows"). PKCE stays on unless
 * LINKEDIN_PKCE is 0, false, or off. State and nonce checks do not depend on this flag.
 */
export function linkedInPkceEnabled(): boolean {
  const value = (process.env.LINKEDIN_PKCE ?? "1").trim().toLowerCase();
  return value !== "0" && value !== "false" && value !== "off";
}

export function supabaseUrl(): string | null {
  const value = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol !== "https:" && !local) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function supabaseServiceRoleKey(): string | null {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return value || null;
}

export function supabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseServiceRoleKey());
}

export function linkedInRedirectUri(request: NextRequest): string {
  const configured = process.env.LINKEDIN_REDIRECT_URI?.trim();
  if (!configured) {
    return `${request.nextUrl.origin}/api/auth/linkedin/callback`;
  }
  const url = new URL(configured);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !local) {
    throw new Error("LINKEDIN_REDIRECT_URI must be https, or http on localhost.");
  }
  return url.toString();
}
