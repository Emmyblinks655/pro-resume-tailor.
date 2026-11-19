const DEFAULT_SUPPORT_EMAIL = "alphahublimited@gmail.com";

/** Subject used on every public support mailto link. */
export const SUPPORT_SUBJECT = "Pro Resume Tailor support";

const EMAIL = /^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/**
 * Accept a public inbox override only when it is a single plain address.
 * Anything that could change the mailto query falls back to the default.
 */
export function resolveSupportEmail(value: string | undefined): string {
  const email = value?.trim() ?? "";
  if (!email || email.length > 254 || !EMAIL.test(email)) return DEFAULT_SUPPORT_EMAIL;
  return email;
}

/** Public support inbox. NEXT_PUBLIC_SUPPORT_EMAIL overrides the default. */
export const SUPPORT_EMAIL = resolveSupportEmail(process.env.NEXT_PUBLIC_SUPPORT_EMAIL);

export function supportMailto(subject: string = SUPPORT_SUBJECT): string {
  const safeSubject = subject.replace(/[\r\n]+/g, " ").trim().slice(0, 200) || SUPPORT_SUBJECT;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(safeSubject)}`;
}
