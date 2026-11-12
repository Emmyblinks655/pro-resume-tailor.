import assert from "node:assert/strict";
import { generateKeyPairSync, sign, type JsonWebKey } from "node:crypto";
import test from "node:test";

import { decryptString, encryptString, readTokenEncryptionKey, safeEqual } from "../crypto/secret-box";
import { buildLinkedInAuthorizeUrl, verifyLinkedInIdToken } from "./oauth";
import { createPkcePair } from "./pkce";
import { readLinkedInProfile } from "./profile";
import { openConnection, parseConnectionRecord, sealConnection } from "./record";
import { LINKEDIN_SCOPES, linkedInScopeParam, scopesAreAllowed } from "./scopes";
import { parseOAuthTransaction } from "./transaction";

test("scopes stay limited to OpenID Connect", () => {
  assert.deepEqual(
    LINKEDIN_SCOPES.map((item) => item.scope),
    ["openid", "profile", "email"],
  );
  assert.equal(linkedInScopeParam(), "openid profile email");
  assert.equal(scopesAreAllowed("email openid profile"), true);
  assert.equal(scopesAreAllowed("openid profile email r_liteprofile"), false);
  assert.equal(scopesAreAllowed("profile email"), false);
});

test("profile reader keeps only name, email, photo, and member id", () => {
  const profile = readLinkedInProfile({
    sub: "782bbtaQ",
    name: "Ada Lovelace",
    email: "ada@example.com",
    picture: "https://media.licdn.com/photo.jpg",
    headline: "Mathematician",
    connections: 500,
    positions: [{ title: "Invented" }],
  });
  assert.deepEqual(profile, {
    memberId: "782bbtaQ",
    name: "Ada Lovelace",
    email: "ada@example.com",
    pictureUrl: "https://media.licdn.com/photo.jpg",
  });
  assert.equal(readLinkedInProfile({ sub: "abc", picture: "http://example.com/a.jpg" })?.pictureUrl, null);
  assert.equal(readLinkedInProfile({ sub: "abc" }, "other"), null);
});

test("AES-256-GCM round trip rejects tampering and the wrong key", () => {
  const key = Buffer.from("a".repeat(32));
  const other = Buffer.from("b".repeat(32));
  const sealed = encryptString("token-value", key);
  assert.equal(decryptString(sealed, key), "token-value");
  assert.equal(decryptString(sealed, other), null);
  const parts = sealed.split(".");
  parts[3] = `${parts[3].slice(0, -2)}aa`;
  assert.equal(decryptString(parts.join("."), key), null);
  assert.equal(safeEqual("state-a", "state-a"), true);
  assert.equal(safeEqual("state-a", "state-b"), false);
});

test("encryption key must be 32 bytes", () => {
  const previous = process.env.TOKEN_ENCRYPTION_KEY;
  process.env.TOKEN_ENCRYPTION_KEY = Buffer.from("c".repeat(32)).toString("base64");
  const key = readTokenEncryptionKey();
  assert.equal(key?.length, 32);
  process.env.TOKEN_ENCRYPTION_KEY = "too-short";
  assert.equal(readTokenEncryptionKey(), null);
  process.env.TOKEN_ENCRYPTION_KEY = "ab".repeat(32);
  assert.equal(readTokenEncryptionKey()?.length, 32);
  if (previous === undefined) delete process.env.TOKEN_ENCRYPTION_KEY;
  else process.env.TOKEN_ENCRYPTION_KEY = previous;
});

test("connection record drops unexpected fields and seals the token", () => {
  const key = Buffer.from("d".repeat(32));
  const parsed = parseConnectionRecord({
    profile: {
      memberId: "member-1",
      name: "Grace Hopper",
      email: "grace@example.com",
      pictureUrl: "https://media.licdn.com/g.jpg",
      headline: "Admiral",
    },
    accessToken: "access-token",
    refreshToken: null,
    expiresAt: null,
    scopes: "openid profile email",
    connectedAt: "2026-11-12T00:00:00.000Z",
    pictureOmitted: false,
    extra: "nope",
  });
  assert.ok(parsed);
  assert.equal("extra" in parsed, false);
  assert.equal("headline" in parsed.profile, false);
  const opened = openConnection(sealConnection(parsed, key), key);
  assert.equal(opened?.accessToken, "access-token");
  assert.equal(openConnection(sealConnection(parsed, key), Buffer.from("e".repeat(32))), null);
});

test("authorize URL carries state, nonce, scopes, and PKCE unless the challenge is omitted", () => {
  const pair = createPkcePair();
  assert.equal(pair.verifier.length >= 43, true);
  const withPkce = new URL(
    buildLinkedInAuthorizeUrl({
      clientId: "client",
      redirectUri: "https://pro-resume-tailor.vercel.app/api/auth/linkedin/callback",
      state: "state-1",
      nonce: "nonce-1",
      codeChallenge: pair.challenge,
    }),
  );
  assert.equal(withPkce.searchParams.get("scope"), "openid profile email");
  assert.equal(withPkce.searchParams.get("state"), "state-1");
  assert.equal(withPkce.searchParams.get("nonce"), "nonce-1");
  assert.equal(withPkce.searchParams.get("code_challenge"), pair.challenge);
  assert.equal(withPkce.searchParams.get("code_challenge_method"), "S256");
  const withoutPkce = new URL(
    buildLinkedInAuthorizeUrl({
      clientId: "client",
      redirectUri: "https://pro-resume-tailor.vercel.app/api/auth/linkedin/callback",
      state: "state-1",
      nonce: "nonce-1",
      codeChallenge: null,
    }),
  );
  assert.equal(withoutPkce.searchParams.get("code_challenge"), null);
});

test("ID token verification checks signature, issuer, audience, and nonce", () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = publicKey.export({ format: "jwk" }) as JsonWebKey & { kid?: string; alg?: string };
  jwk.kid = "test-key";
  jwk.alg = "RS256";
  const now = 1_700_000_000_000;
  const signToken = (payload: Record<string, unknown>, kid = "test-key") => {
    const header = Buffer.from(JSON.stringify({ alg: "RS256", kid, typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const data = `${header}.${body}`;
    const signature = sign("RSA-SHA256", Buffer.from(data), privateKey).toString("base64url");
    return `${data}.${signature}`;
  };
  const payload = {
    iss: "https://www.linkedin.com",
    aud: "client",
    sub: "member-1",
    nonce: "nonce-1",
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + 600,
    name: "Ada Lovelace",
  };
  const ok = verifyLinkedInIdToken(signToken(payload), {
    clientId: "client",
    nonce: "nonce-1",
    jwks: { keys: [jwk] },
    nowMs: now,
  });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.memberId, "member-1");

  const badNonce = verifyLinkedInIdToken(signToken(payload), {
    clientId: "client",
    nonce: "other-nonce",
    jwks: { keys: [jwk] },
    nowMs: now,
  });
  assert.deepEqual(badNonce, { ok: false, reason: "nonce" });

  const badIssuer = verifyLinkedInIdToken(signToken({ ...payload, iss: "https://evil.example" }), {
    clientId: "client",
    nonce: "nonce-1",
    jwks: { keys: [jwk] },
    nowMs: now,
  });
  assert.deepEqual(badIssuer, { ok: false, reason: "token" });

  const [h, b, s] = signToken(payload).split(".");
  const tampered = verifyLinkedInIdToken(`${h}.${b}.${s.slice(0, -2)}aa`, {
    clientId: "client",
    nonce: "nonce-1",
    jwks: { keys: [jwk] },
    nowMs: now,
  });
  assert.deepEqual(tampered, { ok: false, reason: "token" });
});

test("oauth transaction rejects a non-local http redirect", () => {
  assert.equal(
    parseOAuthTransaction({
      state: "s",
      nonce: "n",
      codeVerifier: "a".repeat(43),
      redirectUri: "http://evil.example/callback",
      createdAt: "2026-11-12T00:00:00.000Z",
    }),
    null,
  );
  assert.ok(
    parseOAuthTransaction({
      state: "s",
      nonce: "n",
      codeVerifier: null,
      redirectUri: "https://pro-resume-tailor.vercel.app/api/auth/linkedin/callback",
      createdAt: "2026-11-12T00:00:00.000Z",
    }),
  );
});
