import { NextResponse, type NextRequest } from "next/server";

import { encryptString, readTokenEncryptionKey } from "@/lib/crypto/secret-box";
import {
  linkedInAppConfigured,
  linkedInClientId,
  linkedInPkceEnabled,
  linkedInRedirectUri,
} from "@/lib/linkedin/config";
import {
  OAUTH_COOKIE,
  OAUTH_MAX_AGE,
  requestIsHttps,
  sameOriginMutation,
  sealedCookieOptions,
} from "@/lib/linkedin/cookies";
import { buildLinkedInAuthorizeUrl } from "@/lib/linkedin/oauth";
import { createPkcePair, randomUrlToken } from "@/lib/linkedin/pkce";

function consentRedirect(request: NextRequest, code?: string) {
  const url = new URL("/settings/linkedin", request.nextUrl.origin);
  if (code) url.searchParams.set("linkedin", code);
  return NextResponse.redirect(url, 303);
}

export function GET(request: NextRequest) {
  return consentRedirect(request);
}

export function POST(request: NextRequest) {
  if (!sameOriginMutation(request)) return consentRedirect(request, "error_start");
  if (!linkedInAppConfigured()) return consentRedirect(request, "error_not_configured");
  const key = readTokenEncryptionKey();
  const clientId = linkedInClientId();
  if (!key || !clientId) return consentRedirect(request, key ? "error_not_configured" : "error_encryption");

  let redirectUri: string;
  try {
    redirectUri = linkedInRedirectUri(request);
  } catch {
    return consentRedirect(request, "error_redirect");
  }

  const state = randomUrlToken();
  const nonce = randomUrlToken();
  const pkce = linkedInPkceEnabled() ? createPkcePair() : null;
  const destination = buildLinkedInAuthorizeUrl({
    clientId,
    redirectUri,
    state,
    nonce,
    codeChallenge: pkce?.challenge ?? null,
  });
  const response = NextResponse.redirect(destination, 303);
  response.cookies.set(
    OAUTH_COOKIE,
    encryptString(
      JSON.stringify({
        state,
        nonce,
        codeVerifier: pkce?.verifier ?? null,
        redirectUri,
        createdAt: new Date().toISOString(),
      }),
      key,
    ),
    sealedCookieOptions(requestIsHttps(request), OAUTH_MAX_AGE),
  );
  return response;
}
