import { headers } from "next/headers";

import { safeNextPath } from "@/lib/auth/paths";

export async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host")?.split(",")[0]?.trim() || headerList.get("host");
  const proto = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

export function callbackUrl(origin: string, nextPath: string): string {
  return `${origin}/auth/callback?next=${encodeURIComponent(safeNextPath(nextPath))}`;
}
