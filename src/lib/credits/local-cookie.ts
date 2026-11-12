import { cookies } from "next/headers";

import {
  CREDIT_NOTE,
  type CreditBalance,
  type CreditReason,
  type StoredCredits,
} from "@/lib/credits/types";

const COOKIE = "prt_credits";
const MAX_AGE = 60 * 60 * 24 * 180;

export function startingCredits(): number {
  const raw = Number(process.env.LOCAL_CREDITS_START ?? "5");
  if (!Number.isFinite(raw)) return 5;
  return Math.min(50, Math.max(0, Math.floor(raw)));
}

function publicBalance(remaining: number): CreditBalance {
  return {
    remaining,
    source: "local-cookie",
    label: "Local preview credits",
    note: CREDIT_NOTE,
  };
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}

function decode(value: string | undefined): StoredCredits | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as StoredCredits;
    if (!parsed || typeof parsed.subjectId !== "string" || typeof parsed.remaining !== "number") {
      return null;
    }
    return {
      subjectId: parsed.subjectId,
      remaining: Math.max(0, Math.floor(parsed.remaining)),
      entries: Array.isArray(parsed.entries) ? parsed.entries.slice(0, 20) : [],
    };
  } catch {
    return null;
  }
}

function encode(stored: StoredCredits): string {
  return Buffer.from(JSON.stringify(stored), "utf8").toString("base64url");
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function load(jar: CookieStore): StoredCredits {
  const existing = decode(jar.get(COOKIE)?.value);
  if (existing) return existing;
  const subjectId = crypto.randomUUID();
  const amount = startingCredits();
  return {
    subjectId,
    remaining: amount,
    entries: [
      {
        id: crypto.randomUUID(),
        subjectId,
        delta: amount,
        reason: "seed",
        source: "local-cookie" as const,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

function save(jar: CookieStore, stored: StoredCredits, delta: number, reason: CreditReason): CreditBalance {
  const next: StoredCredits = {
    subjectId: stored.subjectId,
    remaining: Math.max(0, stored.remaining + delta),
    entries: [
      {
        id: crypto.randomUUID(),
        subjectId: stored.subjectId,
        delta,
        reason,
        source: "local-cookie" as const,
        createdAt: new Date().toISOString(),
      },
      ...stored.entries,
    ].slice(0, 20),
  };
  jar.set(COOKIE, encode(next), cookieOptions());
  return publicBalance(next.remaining);
}

export async function getLocalCredits(): Promise<CreditBalance> {
  const jar = await cookies();
  const stored = load(jar);
  if (!decode(jar.get(COOKIE)?.value)) {
    jar.set(COOKIE, encode(stored), cookieOptions());
  }
  return publicBalance(stored.remaining);
}

export async function consumeLocalCredit(): Promise<{ ok: boolean; balance: CreditBalance }> {
  const jar = await cookies();
  const stored = load(jar);
  if (stored.remaining < 1) {
    jar.set(COOKIE, encode(stored), cookieOptions());
    return { ok: false, balance: publicBalance(stored.remaining) };
  }
  return { ok: true, balance: save(jar, stored, -1, "tailor") };
}

export async function refundLocalCredit(): Promise<CreditBalance> {
  const jar = await cookies();
  return save(jar, load(jar), 1, "refund");
}
