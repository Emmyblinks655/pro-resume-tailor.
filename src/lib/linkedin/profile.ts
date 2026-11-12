export type LinkedInProfile = {
  memberId: string;
  name: string | null;
  email: string | null;
  pictureUrl: string | null;
};

function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  if (!name || name.length > 200) return name ? name.slice(0, 200) : null;
  return name;
}

function cleanEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim();
  if (!email || email.length > 320 || !email.includes("@") || /\s/.test(email)) return null;
  return email;
}

function cleanPicture(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const picture = value.trim();
  if (!picture.startsWith("https://") || picture.length > 2000) return null;
  return picture;
}

/** Keep only the OpenID claims this app is allowed to store. Extra fields are dropped. */
export function readLinkedInProfile(value: unknown, expectedMemberId?: string): LinkedInProfile | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const memberId = typeof record.sub === "string" ? record.sub.trim() : "";
  if (!memberId || memberId.length > 256) return null;
  if (expectedMemberId && memberId !== expectedMemberId) return null;
  const given = cleanName(record.given_name);
  const family = cleanName(record.family_name);
  const combined = [given, family].filter(Boolean).join(" ");
  return {
    memberId,
    name: cleanName(record.name) ?? (combined || null),
    email: cleanEmail(record.email),
    pictureUrl: cleanPicture(record.picture),
  };
}
