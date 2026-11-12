import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "prt_sid";
export const OAUTH_COOKIE = "prt_li_tx";
export const CONNECTION_COOKIE = "prt_li_conn";

export const SESSION_MAX_AGE = 60 * 60 * 24 * 180;
export const OAUTH_MAX_AGE = 60 * 10;
export const CONNECTION_MAX_AGE = 60 * 60 * 24 * 60;

export type CookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
};

export type ReadableCookies = {
  get(name: string): { value: string } | undefined;
};

export type WritableCookies = {
  set(name: string, value: string, options: CookieOptions): void;
};

export function sealedCookieOptions(secure: boolean, maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export function requestIsHttps(request: NextRequest): boolean {
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwarded) return forwarded === "https";
  return request.nextUrl.protocol === "https:";
}

export function sameOriginMutation(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  let sent: URL;
  try {
    sent = new URL(origin);
  } catch {
    return false;
  }
  if (sent.origin === request.nextUrl.origin) return true;
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (host && proto && sent.origin === `${proto}://${host}`) return true;
  return false;
}

export function clearSealedCookie(outgoing: WritableCookies, name: string, secure: boolean) {
  outgoing.set(name, "", sealedCookieOptions(secure, 0));
}

const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function readSessionId(incoming: ReadableCookies): string | null {
  const value = incoming.get(SESSION_COOKIE)?.value;
  if (!value || !SESSION_ID.test(value)) return null;
  return value;
}
