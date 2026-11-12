const PROTECTED = ["/tailor", "/dashboard"];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`));
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
