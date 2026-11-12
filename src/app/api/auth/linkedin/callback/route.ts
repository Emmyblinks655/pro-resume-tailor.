import { NextResponse, type NextRequest } from "next/server";

import { decryptString, readTokenEncryptionKey, safeEqual } from "@/lib/crypto/secret-box";
import { linkedInClientId, linkedInClientSecret } from "@/lib/linkedin/config";
import {
  OAUTH_COOKIE,
  OAUTH_MAX_AGE,
  clearSealedCookie,
  requestIsHttps,
} from "@/lib/linkedin/cookies";
import {
  exchangeLinkedInCode,
  fetchLinkedInJwks,
  fetchLinkedInUserInfo,
  verifyLinkedInIdToken,
} from "@/lib/linkedin/oauth";
import { readLinkedInProfile, type LinkedInProfile } from "@/lib/linkedin/profile";
import type { LinkedInConnectionRecord } from "@/lib/linkedin/record";
import { getLinkedInStore } from "@/lib/linkedin/storage";
import { parseOAuthTransaction } from "@/lib/linkedin/transaction";

function settingsRedirect(request: NextRequest, code: string) {
  const url = new URL("/settings", request.nextUrl.origin);
  url.searchParams.set("linkedin", code);
  const response = NextResponse.redirect(url, 303);
  clearSealedCookie(response.cookies, OAUTH_COOKIE, requestIsHttps(request));
  return response;
}

function mergeProfile(primary: LinkedInProfile | null, fallback: LinkedInProfile | null): LinkedInProfile | null {
  if (primary && fallback && primary.memberId !== fallback.memberId) return null;
  const memberId = primary?.memberId ?? fallback?.memberId;
  if (!memberId) return null;
  return {
    memberId,
    name: primary?.name ?? fallback?.name ?? null,
    email: primary?.email ?? fallback?.email ?? null,
    pictureUrl: primary?.pictureUrl ?? fallback?.pictureUrl ?? null,
  };
}

export async function GET(request: NextRequest) {
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) {
    const denied =
      providerError === "access_denied" ||
      providerError === "user_cancelled_login" ||
      providerError === "user_cancelled_authorize";
    return settingsRedirect(request, denied ? "error_denied" : "error_token");
  }

  const clientId = linkedInClientId();
  const clientSecret = linkedInClientSecret();
  const key = readTokenEncryptionKey();
  if (!clientId || !clientSecret) return settingsRedirect(request, "error_not_configured");
  if (!key) return settingsRedirect(request, "error_encryption");

  const sealed = request.cookies.get(OAUTH_COOKIE)?.value;
  const plain = sealed ? decryptString(sealed, key) : null;
  let transaction = null;
  if (plain) {
    try {
      transaction = parseOAuthTransaction(JSON.parse(plain) as unknown);
    } catch {
      transaction = null;
    }
  }
  if (!transaction) return settingsRedirect(request, "error_state");
  const ageMs = Date.now() - Date.parse(transaction.createdAt);
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > OAUTH_MAX_AGE * 1000) {
    return settingsRedirect(request, "error_state");
  }

  const state = request.nextUrl.searchParams.get("state") ?? "";
  if (!state || !safeEqual(state, transaction.state)) return settingsRedirect(request, "error_state");
  const code = request.nextUrl.searchParams.get("code") ?? "";
  if (!code || code.length > 2048) return settingsRedirect(request, "error_token");

  const jwksPromise = fetchLinkedInJwks();
  const tokens = await exchangeLinkedInCode({
    code,
    redirectUri: transaction.redirectUri,
    codeVerifier: transaction.codeVerifier,
    clientId,
    clientSecret,
  });
  const jwks = await jwksPromise;
  if (!tokens || !jwks) return settingsRedirect(request, "error_token");
  const verified = verifyLinkedInIdToken(tokens.idToken, {
    clientId,
    nonce: transaction.nonce,
    jwks,
  });
  if (!verified.ok) return settingsRedirect(request, verified.reason === "nonce" ? "error_nonce" : "error_token");

  const userInfo = await fetchLinkedInUserInfo(tokens.accessToken);
  if (userInfo && typeof userInfo === "object") {
    const subject = (userInfo as { sub?: unknown }).sub;
    if (typeof subject === "string" && subject !== verified.memberId) {
      return settingsRedirect(request, "error_profile");
    }
  }
  const profile = mergeProfile(
    userInfo ? readLinkedInProfile(userInfo, verified.memberId) : null,
    readLinkedInProfile(
      {
        sub: verified.memberId,
        name: verified.claims.name,
        given_name: verified.claims.given_name,
        family_name: verified.claims.family_name,
        email: verified.claims.email,
        picture: verified.claims.picture,
      },
      verified.memberId,
    ),
  );
  if (!profile) return settingsRedirect(request, "error_profile");

  const record: LinkedInConnectionRecord = {
    profile,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    scopes: tokens.scopes,
    connectedAt: new Date().toISOString(),
    pictureOmitted: false,
  };
  const response = settingsRedirect(request, "connected");
  try {
    await getLinkedInStore().write(
      { incoming: request.cookies, outgoing: response.cookies, secure: requestIsHttps(request) },
      record,
    );
  } catch (error) {
    console.error("LinkedIn connection was not stored.", error instanceof Error ? error.message : "storage");
    return settingsRedirect(request, "error_storage");
  }
  return response;
}
