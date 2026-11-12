import type { Job } from "../types";
import { asRecord, asString, formatSalaryRange, remoteLocation, toIsoDate, toPlainText } from "../text";

function places(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

function tagsFrom(record: Record<string, unknown>): string[] {
  const raw = [...places(record.parentCategories), ...places(record.categories), ...places(record.seniority)];
  const tags: string[] = [];
  for (const item of raw) {
    const label = item.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
    if (!label) continue;
    if (tags.some((tag) => tag.toLowerCase() === label.toLowerCase())) continue;
    tags.push(label);
    if (tags.length >= 6) break;
  }
  return tags;
}

export function normaliseHimalayas(payload: unknown): Job[] {
  const root = asRecord(payload);
  const rows = root && Array.isArray(root.jobs) ? root.jobs : Array.isArray(payload) ? payload : [];
  const jobs: Job[] = [];
  for (const row of rows) {
    const record = asRecord(row);
    if (!record) continue;
    const title = asString(record.title);
    const company = asString(record.companyName);
    const applicationLink = asString(record.applicationLink);
    const guid = asString(record.guid);
    const url = applicationLink.startsWith("http") ? applicationLink : guid.startsWith("http") ? guid : "";
    if (!title || !company || !url) continue;
    const restrictions = places(record.locationRestrictions);
    const place =
      restrictions.length === 0
        ? "Worldwide"
        : restrictions.length > 3
          ? `${restrictions.slice(0, 3).join(", ")} +${restrictions.length - 3}`
          : restrictions.join(", ");
    const description = asString(record.description) || asString(record.excerpt);
    jobs.push({
      id: `himalayas:${guid || url}`,
      source: "himalayas",
      title,
      company,
      location: remoteLocation(true, place),
      remote: true,
      tags: tagsFrom(record),
      salary: formatSalaryRange(record.minSalary, record.maxSalary, record.currency, record.salaryPeriod),
      postedAt: toIsoDate(record.pubDate),
      url,
      description: toPlainText(description),
    });
  }
  return jobs;
}
