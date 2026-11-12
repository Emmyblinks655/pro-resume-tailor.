import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "node:crypto";

const VERSION = "v1";
const AAD = Buffer.from("prt-linkedin-v1");

export function encryptString(plaintext: string, key: Buffer): string {
  if (key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes.");
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(AAD);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(
    ".",
  );
}

export function decryptString(payload: string, key: Buffer): string | null {
  try {
    if (key.length !== 32) return null;
    const parts = payload.split(".");
    if (parts.length !== 4 || parts[0] !== VERSION) return null;
    const iv = Buffer.from(parts[1], "base64url");
    const tag = Buffer.from(parts[2], "base64url");
    const ciphertext = Buffer.from(parts[3], "base64url");
    if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) return null;
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(AAD);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Accepts a 32-byte key as 64 hex characters or standard/base64url text.
 * `openssl rand -base64 32` is the expected way to mint one.
 * A passphrase is rejected so a short secret is never stretched into a key.
 */
export function readTokenEncryptionKey(): Buffer | null {
  const raw = process.env.TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    const hex = Buffer.from(raw, "hex");
    return hex.length === 32 ? hex : null;
  }
  const decoded = /[+/=]/.test(raw) ? Buffer.from(raw, "base64") : Buffer.from(raw, "base64url");
  return decoded.length === 32 ? decoded : null;
}
