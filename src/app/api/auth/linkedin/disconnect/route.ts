import { NextResponse, type NextRequest } from "next/server";

import { linkedInClientId, linkedInClientSecret } from "@/lib/linkedin/config";
import {
  CONNECTION_COOKIE,
  OAUTH_COOKIE,
  clearSealedCookie,
  requestIsHttps,
  sameOriginMutation,
} from "@/lib/linkedin/cookies";
import { revokeLinkedInTokens } from "@/lib/linkedin/oauth";
import { getLinkedInStore } from "@/lib/linkedin/storage";

function settingsRedirect(request: NextRequest, code: string) {
  const url = new URL("/settings", request.nextUrl.origin);
  url.searchParams.set("linkedin", code);
  const response = NextResponse.redirect(url, 303);
  clearSealedCookie(response.cookies, OAUTH_COOKIE, requestIsHttps(request));
  return response;
}

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/settings", request.nextUrl.origin), 303);
}

export async function POST(request: NextRequest) {
  if (!sameOriginMutation(request)) return settingsRedirect(request, "error_start");
  const secure = requestIsHttps(request);
  const store = getLinkedInStore();
  const read = await store.read(request.cookies);
  let code = "disconnected_local";

  if (read.status === "ready") {
    const clientId = linkedInClientId();
    const clientSecret = linkedInClientSecret();
    if (!clientId || !clientSecret) {
      code = "disconnected_failed";
    } else {
      const result = await revokeLinkedInTokens(read.record, clientId, clientSecret);
      code =
        result === "revoked"
          ? "disconnected_revoked"
          : result === "unsupported"
            ? "disconnected_unsupported"
            : "disconnected_failed";
    }
  } else if (read.status === "locked" || read.status === "unreadable") {
    code = "disconnected_unreadable";
  }

  if (read.status === "error") code = "disconnected_failed";
  const response = settingsRedirect(request, code);
  try {
    await store.delete({ incoming: request.cookies, outgoing: response.cookies, secure });
  } catch (error) {
    console.error("LinkedIn disconnect did not finish.", error instanceof Error ? error.message : "storage");
    const failed = settingsRedirect(request, "error_storage");
    clearSealedCookie(failed.cookies, CONNECTION_COOKIE, secure);
    return failed;
  }
  return response;
}
