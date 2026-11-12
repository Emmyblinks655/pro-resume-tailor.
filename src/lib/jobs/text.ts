const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "...",
  mdash: "-",
  ndash: "-",
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (entity, body: string) => {
    if (body[0] === "#") {
      const hex = body[1] === "x" || body[1] === "X";
      const code = Number.parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return entity;
      return String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
  });
}

function stripTags(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
}

/** Plain text for cards and the tailor hand-off. Tags and scripts are removed. */
export function toPlainText(value: string, max = 900): string {
  const decoded = decodeEntities(stripTags(value));
  const stripped = stripTags(decoded)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([.,;:!?])/g, "$1")
    .trim();
  if (stripped.length <= max) return stripped;
  const cut = stripped.slice(0, max).replace(/\s+\S*$/, "").trim();
  return `${cut}...`;
}

export function toIsoDate(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    const ms = value > 1e12 ? value : value * 1000;
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  }
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed);
  const date = new Date(hasZone ? trimmed : `${trimmed}Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function formatPosted(iso: string | null): string {
  if (!iso) return "Date unavailable";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Remote OK sometimes sends UTF-8 punctuation decoded as Latin-1. */
export function repairMojibake(value: string): string {
  if (!/[\u00c2\u00c3\u00e2]/.test(value)) return value;
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code > 255) return value;
    bytes[index] = code;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return value;
  }
}

export function asString(value: unknown): string {
  return typeof value === "string" ? repairMojibake(value).trim() : "";
}

export function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const tags: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const tag = item.trim();
    if (!tag) continue;
    if (tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) continue;
    tags.push(tag);
    if (tags.length >= 8) break;
  }
  return tags;
}

export function remoteLocation(remote: boolean, place: string): string {
  const clean = place.replace(/\s+/g, " ").trim();
  if (!clean) return remote ? "Remote" : "Location unavailable";
  if (!remote) return clean;
  if (/remote/i.test(clean)) return clean;
  return `Remote · ${clean}`;
}

const PERIODS: Record<string, string> = {
  hourly: "hour",
  weekly: "week",
  fortnightly: "fortnight",
  monthly: "month",
  annual: "year",
  yearly: "year",
};

function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatSalaryRange(
  min: unknown,
  max: unknown,
  currency: unknown,
  period: unknown,
): string | null {
  const lo = typeof min === "number" && min > 0 ? min : null;
  const hi = typeof max === "number" && max > 0 ? max : null;
  if (lo == null && hi == null) return null;
  const cur = asString(currency);
  const rawPeriod = asString(period).toLowerCase();
  const per = rawPeriod ? `/${PERIODS[rawPeriod] ?? rawPeriod}` : "";
  const amount =
    lo != null && hi != null && lo !== hi
      ? `${formatNumber(lo)}-${formatNumber(hi)}`
      : formatNumber((lo ?? hi) as number);
  return `${cur} ${amount}${per}`.trim();
}

export function salaryText(value: unknown): string | null {
  const text = asString(value);
  return text || null;
}

export function excerpt(text: string, max = 220): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max).replace(/\s+\S*$/, "").trim()}...`;
}
