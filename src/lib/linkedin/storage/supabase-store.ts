import { randomUUID } from "node:crypto";

import { readTokenEncryptionKey } from "@/lib/crypto/secret-box";
import {
  CONNECTION_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  clearSealedCookie,
  readSessionId,
  sealedCookieOptions,
} from "@/lib/linkedin/cookies";
import { supabaseServiceRoleKey, supabaseUrl } from "@/lib/linkedin/config";
import { openTokenPayload, sealTokenPayload, type LinkedInConnectionRecord } from "@/lib/linkedin/record";
import type { LinkedInConnectionStore, LinkedInCookieAccess, LinkedInRead } from "@/lib/linkedin/storage/types";

type Row = {
  member_id: string;
  display_name: string | null;
  email: string | null;
  picture_url: string | null;
  token_ciphertext: string;
  token_expires_at: string | null;
  scopes: string;
  connected_at: string;
};

function endpoint(sessionId?: string): string | null {
  const root = supabaseUrl();
  if (!root) return null;
  const url = new URL("/rest/v1/linkedin_connections", root);
  if (sessionId) {
    url.searchParams.set("session_id", `eq.${sessionId}`);
    url.searchParams.set("select", "member_id,display_name,email,picture_url,token_ciphertext,token_expires_at,scopes,connected_at");
    url.searchParams.set("limit", "1");
  }
  return url.toString();
}

function headers(key: string, prefer?: string): HeadersInit {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

function rowToRecord(row: Row, tokens: { accessToken: string; refreshToken: string | null } | null): LinkedInConnectionRecord | null {
  if (!row.member_id || !row.scopes || !row.connected_at) return null;
  const pictureUrl = row.picture_url && row.picture_url.startsWith("https://") ? row.picture_url : null;
  return {
    profile: {
      memberId: row.member_id,
      name: row.display_name,
      email: row.email,
      pictureUrl,
    },
    accessToken: tokens?.accessToken ?? "",
    refreshToken: tokens?.refreshToken ?? null,
    expiresAt: row.token_expires_at,
    scopes: row.scopes,
    connectedAt: row.connected_at,
    pictureOmitted: false,
  };
}

async function loadRow(sessionId: string, key: string): Promise<Row | null | "error"> {
  const url = endpoint(sessionId);
  if (!url) return "error";
  try {
    const response = await fetch(url, {
      headers: headers(key),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return "error";
    const rows = (await response.json()) as unknown;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const row = rows[0] as Row;
    if (!row || typeof row.member_id !== "string" || typeof row.token_ciphertext !== "string") return "error";
    return row;
  } catch {
    return "error";
  }
}

export const supabaseLinkedInStore: LinkedInConnectionStore = {
  kind: "supabase",

  async read(incoming): Promise<LinkedInRead> {
    const sessionId = readSessionId(incoming);
    if (!sessionId) return { status: "empty" };
    const serviceKey = supabaseServiceRoleKey();
    if (!serviceKey) return { status: "error" };
    const row = await loadRow(sessionId, serviceKey);
    if (row === "error") return { status: "error" };
    if (!row) return { status: "empty" };
    const encryptionKey = readTokenEncryptionKey();
    const base = rowToRecord(row, null);
    if (!base) return { status: "error" };
    if (!encryptionKey) {
      return { status: "locked", record: { ...base, accessToken: "" } };
    }
    const tokens = openTokenPayload(row.token_ciphertext, encryptionKey);
    if (!tokens) return { status: "locked", record: { ...base, accessToken: "" } };
    return { status: "ready", record: { ...base, ...tokens } };
  },

  async write(access: LinkedInCookieAccess, record: LinkedInConnectionRecord): Promise<void> {
    const serviceKey = supabaseServiceRoleKey();
    const root = supabaseUrl();
    const encryptionKey = readTokenEncryptionKey();
    if (!serviceKey || !root || !encryptionKey) throw new Error("storage");
    const existing = readSessionId(access.incoming);
    const sessionId = existing ?? randomUUID();
    if (!existing) {
      access.outgoing.set(SESSION_COOKIE, sessionId, sealedCookieOptions(access.secure, SESSION_MAX_AGE));
    }
    const url = new URL("/rest/v1/linkedin_connections", root);
    url.searchParams.set("on_conflict", "session_id");
    const response = await fetch(url, {
      method: "POST",
      headers: headers(serviceKey, "resolution=merge-duplicates,return=minimal"),
      body: JSON.stringify({
        session_id: sessionId,
        member_id: record.profile.memberId,
        display_name: record.profile.name,
        email: record.profile.email,
        picture_url: record.profile.pictureUrl,
        token_ciphertext: sealTokenPayload(record, encryptionKey),
        token_expires_at: record.expiresAt,
        scopes: record.scopes,
        connected_at: record.connectedAt,
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("storage");
    clearSealedCookie(access.outgoing, CONNECTION_COOKIE, access.secure);
  },

  async delete(access: LinkedInCookieAccess): Promise<void> {
    clearSealedCookie(access.outgoing, CONNECTION_COOKIE, access.secure);
    const sessionId = readSessionId(access.incoming);
    const serviceKey = supabaseServiceRoleKey();
    const root = supabaseUrl();
    if (!sessionId || !serviceKey || !root) return;
    const url = new URL("/rest/v1/linkedin_connections", root);
    url.searchParams.set("session_id", `eq.${sessionId}`);
    const response = await fetch(url, {
      method: "DELETE",
      headers: headers(serviceKey, "return=minimal"),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("storage");
  },
};
