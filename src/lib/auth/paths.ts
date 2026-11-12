const AUTH_REQUIRED = ["/tailor", "/dashboard", "/onboarding"];
const PROFILE_GATED = ["/tailor", "/dashboard"];

function matches(pathname: string, paths: readonly string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function isProtectedPath(pathname: string): boolean {
  return matches(pathname, AUTH_REQUIRED);
}

export function isProfileGatedPath(pathname: string): boolean {
  return matches(pathname, PROFILE_GATED);
}

/** Keep post-login redirects on this site. */
export function safeNextPath(input: string | null | undefined, fallback = "/dashboard"): string {
  if (!input) return fallback;
  let value = input.trim();
  if (!value) return fallback;
  try {
    value = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("\\") || value.includes("://") || value.includes("\n") || value.includes("\r")) {
    return fallback;
  }
  return value;
}
