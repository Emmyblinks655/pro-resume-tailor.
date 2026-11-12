import { safeNextPath } from "@/lib/auth/paths";

export const NAME_MAX = 80;
export const HEADLINE_MAX = 120;

export type ProfileFieldErrors = {
  fullName?: string;
  headline?: string;
};

export type OwnProfile = {
  status: "ready" | "needs-onboarding" | "unavailable";
  email: string | null;
  fullName: string | null;
  headline: string | null;
};

export function tidyText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function validateProfile(fullName: string, headline: string): ProfileFieldErrors {
  const fieldErrors: ProfileFieldErrors = {};
  if (!fullName) fieldErrors.fullName = "Enter your full name.";
  else if (fullName.length > NAME_MAX) fieldErrors.fullName = `Use at most ${NAME_MAX} characters.`;
  if (headline.length > HEADLINE_MAX) fieldErrors.headline = `Use at most ${HEADLINE_MAX} characters.`;
  return fieldErrors;
}

export function needsOnboarding(fullName: string | null | undefined): boolean {
  return !fullName || fullName.trim().length === 0;
}

export function fullNameFromRow(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("full_name" in data)) return null;
  const value = (data as { full_name?: unknown }).full_name;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function withOnboarding(nextPath: string, needsName: boolean): string {
  const next = safeNextPath(nextPath);
  const onboarding = next === "/onboarding" || next.startsWith("/onboarding?");
  if (needsName) return onboarding ? next : `/onboarding?next=${encodeURIComponent(next)}`;
  return onboarding ? "/dashboard" : next;
}

function textOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function profileFromRow(
  row: { email?: unknown; full_name?: unknown; headline?: unknown } | null,
  fallbackEmail: string | null,
): OwnProfile {
  if (!row) {
    return { status: "needs-onboarding", email: fallbackEmail, fullName: null, headline: null };
  }
  const fullName = textOrNull(row.full_name);
  const headline = textOrNull(row.headline);
  const email = textOrNull(row.email) ?? fallbackEmail;
  if (!fullName) return { status: "needs-onboarding", email, fullName: null, headline };
  return { status: "ready", email, fullName, headline };
}
