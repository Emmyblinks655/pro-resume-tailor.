import { createPublicKey, verify as verifySignature, type JsonWebKey } from "node:crypto";

import { safeEqual } from "@/lib/crypto/secret-box";
import { linkedInScopeParam, scopesAreAllowed } from "@/lib/linkedin/scopes";

export const LINKEDIN_ISSUER = "https://www.linkedin.com";
export const LINKEDIN_AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization";
export const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
export const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
export const LINKEDIN_JWKS_URL = "https://www.linkedin.com/oauth/openid/jwks";
export const LINKEDIN_REVOKE_URL = "https://www.linkedin.com/oauth/v2/revoke";

export type LinkedInTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  idToken: string;
  scopes: string;
};

export type IdTokenCheck =
  | { ok: true; memberId: string; claims: Record<string, unknown> }
  | { ok: false; reason: "token" | "nonce" };

type Jwk = JsonWebKey & { kid?: string; alg?: string; use?: string };

const TOKEN_PATTERN = /^[^\s\u0000-\u001f\u007f]+$/;

export function buildLinkedInAuthorizeUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  codeChallenge: string | null;
}): string {
  const url = new URL(LINKEDIN_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("scope", linkedInScopeParam());
  url.searchParams.set("state", input.state);
  url.searchParams.set("nonce", input.nonce);
  if (input.codeChallenge) {
    url.searchParams.set("code_challenge", input.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
  }
  return url.toString();
}

export function verifyLinkedInIdToken(
  idToken: string,
  options: { clientId: string; nonce: string; jwks: { keys: Jwk[] }; nowMs?: number },
): IdTokenCheck {
  const parts = idToken.split(".");
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) return { ok: false, reason: "token" };

  let header: { alg?: string; kid?: string };
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as { alg?: string; kid?: string };
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return { ok: false, reason: "token" };
  }

  if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) {
    return { ok: false, reason: "token" };
  }
  const jwk = options.jwks.keys.find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk || (jwk.alg && jwk.alg !== "RS256")) return { ok: false, reason: "token" };

  let signed = false;
  try {
    const key = createPublicKey({ key: jwk, format: "jwk" });
    signed = verifySignature(
      "RSA-SHA256",
      Buffer.from(`${parts[0]}.${parts[1]}`),
      key,
      Buffer.from(parts[2], "base64url"),
    );
  } catch {
    return { ok: false, reason: "token" };
  }
  if (!signed) return { ok: false, reason: "token" };

  const now = Math.floor((options.nowMs ?? Date.now()) / 1000);
  if (payload.iss !== LINKEDIN_ISSUER) return { ok: false, reason: "token" };
  const audience = payload.aud;
  const audienceOk =
    audience === options.clientId || (Array.isArray(audience) && audience.includes(options.clientId));
  if (!audienceOk) return { ok: false, reason: "token" };
  if (typeof payload.exp !== "number" || payload.exp < now - 60) return { ok: false, reason: "token" };
  if (typeof payload.iat === "number" && payload.iat > now + 5 * 60) return { ok: false, reason: "token" };
  if (typeof payload.sub !== "string" || !payload.sub.trim() || payload.sub.length > 256) {
    return { ok: false, reason: "token" };
  }
  if (typeof payload.nonce !== "string" || !safeEqual(payload.nonce, options.nonce)) {
    return { ok: false, reason: "nonce" };
  }
  return { ok: true, memberId: payload.sub, claims: payload };
}

function usableToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const token = value.trim();
  if (!token || token.length > 4096 || !TOKEN_PATTERN.test(token)) return null;
  return token;
}

export async function exchangeLinkedInCode(
  input: {
    code: string;
    redirectUri: string;
    codeVerifier: string | null;
    clientId: string;
    clientSecret: string;
  },
  fetcher: typeof fetch = fetch,
): Promise<LinkedInTokens | null> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: input.redirectUri,
    client_id: input.clientId,
    client_secret: input.clientSecret,
  });
  if (input.codeVerifier) body.set("code_verifier", input.codeVerifier);

  let response: Response;
  try {
    response = await fetcher(LINKEDIN_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;

  let payload: unknown;
  try {
    const text = await response.text();
    if (text.length > 20000) return null;
    payload = JSON.parse(text) as unknown;
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const accessToken = usableToken(record.access_token);
  const idToken = usableToken(record.id_token);
  if (!accessToken || !idToken) return null;
  const scope = typeof record.scope === "string" && record.scope.trim() ? record.scope.trim() : linkedInScopeParam();
  if (!scopesAreAllowed(scope)) return null;
  const refreshToken = record.refresh_token == null ? null : usableToken(record.refresh_token);
  if (record.refresh_token != null && !refreshToken) return null;
  const expiresAt =
    typeof record.expires_in === "number" && Number.isFinite(record.expires_in) && record.expires_in > 0
      ? new Date(Date.now() + record.expires_in * 1000).toISOString()
      : null;
  return { accessToken, refreshToken, expiresAt, idToken, scopes: scope };
}

export async function fetchLinkedInUserInfo(
  accessToken: string,
  fetcher: typeof fetch = fetch,
): Promise<unknown | null> {
  let response: Response;
  try {
    response = await fetcher(LINKEDIN_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;
  try {
    const text = await response.text();
    if (text.length > 20000) return null;
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

let jwksCache: { fetchedAt: number; keys: Jwk[] } | null = null;

export async function fetchLinkedInJwks(fetcher: typeof fetch = fetch): Promise<{ keys: Jwk[] } | null> {
  const now = Date.now();
  if (jwksCache && now - jwksCache.fetchedAt < 10 * 60 * 1000) {
    return { keys: jwksCache.keys };
  }
  let response: Response;
  try {
    response = await fetcher(LINKEDIN_JWKS_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return jwksCache ? { keys: jwksCache.keys } : null;
  }
  if (!response.ok) return jwksCache ? { keys: jwksCache.keys } : null;
  try {
    const text = await response.text();
    if (text.length > 100000) return null;
    const payload = JSON.parse(text) as { keys?: Jwk[] };
    if (!payload.keys || !Array.isArray(payload.keys)) return null;
    jwksCache = { fetchedAt: now, keys: payload.keys };
    return { keys: payload.keys };
  } catch {
    return null;
  }
}

export type RevokeResult = "revoked" | "unsupported" | "failed";

async function revokeOne(
  token: string,
  clientId: string,
  clientSecret: string,
  fetcher: typeof fetch,
): Promise<RevokeResult> {
  let response: Response;
  try {
    response = await fetcher(LINKEDIN_REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, token }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return "failed";
  }
  if (response.status === 200 || response.status === 204) return "revoked";
  if (response.status === 404 || response.status === 405 || response.status === 501) return "unsupported";
  const text = await response.text().catch(() => "");
  const clipped = text.slice(0, 400);
  if (clipped.includes(token)) return "failed";
  if (/"error"\s*:\s*"(invalid_token|expired_token)"/.test(clipped)) return "revoked";
  if (/unsupported/i.test(clipped)) return "unsupported";
  return "failed";
}

export async function revokeLinkedInTokens(
  tokens: { accessToken: string; refreshToken: string | null },
  clientId: string,
  clientSecret: string,
  fetcher: typeof fetch = fetch,
): Promise<RevokeResult> {
  const access = await revokeOne(tokens.accessToken, clientId, clientSecret, fetcher);
  if (!tokens.refreshToken) return access;
  const refresh = await revokeOne(tokens.refreshToken, clientId, clientSecret, fetcher);
  if (access === "revoked" && (refresh === "revoked" || refresh === "unsupported")) return "revoked";
  if (access === "unsupported" && refresh !== "failed") return "unsupported";
  return "failed";
}
