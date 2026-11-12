/**
 * Sign In with LinkedIn using OpenID Connect.
 * These are the only scopes an ordinary app can request without partner approval.
 * Add a scope here only after LinkedIn approves that product, and update the
 * "not shared" list on the consent screen in the same change.
 */
export const LINKEDIN_SCOPES = [
  {
    scope: "openid",
    reads: "The member ID (OpenID subject) that identifies the LinkedIn account.",
  },
  {
    scope: "profile",
    reads: "Your name and profile photo.",
  },
  {
    scope: "email",
    reads: "Your email address.",
  },
] as const;

export const LINKEDIN_NOT_SHARED = [
  "Work history and job titles",
  "Education",
  "Endorsements or a skills list",
  "Connections, followers, or the rest of your network",
  "Messages or posts",
] as const;

export const LINKEDIN_USES = [
  "Identify the connected account on this browser.",
  "Show your name, email, and profile photo in Settings.",
  "Keep the name and email for a later profile pre-fill. This version does not build a resume from LinkedIn.",
] as const;

export const LINKEDIN_NOT_CONFIGURED_LABEL = "LinkedIn connect not configured yet";
export const TOKEN_ENCRYPTION_NOT_CONFIGURED_LABEL = "Token encryption is not configured yet";

export function linkedInScopeParam(): string {
  return LINKEDIN_SCOPES.map((item) => item.scope).join(" ");
}

const ALLOWED_SCOPES = new Set<string>(LINKEDIN_SCOPES.map((item) => item.scope));

/** Reject a token whose granted scopes go beyond the consent screen. */
export function scopesAreAllowed(scope: string): boolean {
  const granted = scope.split(/[\s,]+/).filter(Boolean);
  if (granted.length === 0) return false;
  if (!granted.includes("openid")) return false;
  return granted.every((item) => ALLOWED_SCOPES.has(item));
}
