import { decryptString, encryptString } from "@/lib/crypto/secret-box";
import type { LinkedInProfile } from "@/lib/linkedin/profile";

export type LinkedInConnectionRecord = {
  profile: LinkedInProfile;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  scopes: string;
  connectedAt: string;
  pictureOmitted: boolean;
};

const TOKEN_PATTERN = /^[^\s\u0000-\u001f\u007f]+$/;

function cleanToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value || value.length > 4096 || !TOKEN_PATTERN.test(value)) return null;
  return value;
}

export function parseConnectionRecord(value: unknown): LinkedInConnectionRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const profileRaw = record.profile;
  if (!profileRaw || typeof profileRaw !== "object") return null;
  const profile = profileRaw as Record<string, unknown>;
  const memberId = typeof profile.memberId === "string" ? profile.memberId.trim() : "";
  if (!memberId || memberId.length > 256) return null;
  const accessToken = cleanToken(record.accessToken);
  if (!accessToken) return null;
  const refreshToken = record.refreshToken == null ? null : cleanToken(record.refreshToken);
  if (record.refreshToken != null && !refreshToken) return null;
  const name = typeof profile.name === "string" && profile.name.trim() ? profile.name.trim().slice(0, 200) : null;
  const email =
    typeof profile.email === "string" && profile.email.includes("@") && profile.email.length <= 320
      ? profile.email.trim()
      : null;
  const pictureUrl =
    typeof profile.pictureUrl === "string" &&
    profile.pictureUrl.startsWith("https://") &&
    profile.pictureUrl.length <= 2000
      ? profile.pictureUrl
      : null;
  const scopes = typeof record.scopes === "string" ? record.scopes.trim().slice(0, 200) : "";
  if (!scopes) return null;
  const connectedAt = typeof record.connectedAt === "string" ? record.connectedAt : "";
  if (!connectedAt || Number.isNaN(Date.parse(connectedAt))) return null;
  const expiresAt =
    record.expiresAt == null
      ? null
      : typeof record.expiresAt === "string" && !Number.isNaN(Date.parse(record.expiresAt))
        ? record.expiresAt
        : null;
  return {
    profile: { memberId, name, email, pictureUrl },
    accessToken,
    refreshToken,
    expiresAt,
    scopes,
    connectedAt,
    pictureOmitted: record.pictureOmitted === true,
  };
}

export function sealConnection(record: LinkedInConnectionRecord, key: Buffer): string {
  return encryptString(JSON.stringify(record), key);
}

export function openConnection(payload: string, key: Buffer): LinkedInConnectionRecord | null {
  const plain = decryptString(payload, key);
  if (!plain) return null;
  try {
    return parseConnectionRecord(JSON.parse(plain) as unknown);
  } catch {
    return null;
  }
}

export function sealTokenPayload(record: Pick<LinkedInConnectionRecord, "accessToken" | "refreshToken">, key: Buffer): string {
  return encryptString(
    JSON.stringify({ accessToken: record.accessToken, refreshToken: record.refreshToken }),
    key,
  );
}

export function openTokenPayload(
  payload: string,
  key: Buffer,
): { accessToken: string; refreshToken: string | null } | null {
  const plain = decryptString(payload, key);
  if (!plain) return null;
  try {
    const parsed = JSON.parse(plain) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    const accessToken = cleanToken(record.accessToken);
    if (!accessToken) return null;
    const refreshToken = record.refreshToken == null ? null : cleanToken(record.refreshToken);
    if (record.refreshToken != null && !refreshToken) return null;
    return { accessToken, refreshToken };
  } catch {
    return null;
  }
}
