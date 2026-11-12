import type { Job } from "../types";
import { asRecord, asString, asStringList, formatSalaryRange, remoteLocation, toIsoDate, toPlainText } from "../text";

export function normaliseRemoteOk(payload: unknown): Job[] {
  if (!Array.isArray(payload)) return [];
  const jobs: Job[] = [];
  for (const row of payload) {
    const record = asRecord(row);
    if (!record) continue;
    // The first array item is a legal notice, not a job.
    if (typeof record.legal === "string" && !asString(record.position)) continue;
    const title = asString(record.position);
    const company = asString(record.company);
    const slug = asString(record.slug);
    const direct = asString(record.url);
    const apply = asString(record.apply_url);
    const url = direct.startsWith("http")
      ? direct
      : apply.startsWith("http")
        ? apply
        : slug
          ? `https://remoteok.com/remote-jobs/${slug}`
          : "";
    if (!title || !company || !url.startsWith("http")) continue;
    const id = record.id == null ? slug || url : String(record.id);
    const place = asString(record.location);
    jobs.push({
      id: `remoteok:${id}`,
      source: "remoteok",
      title,
      company,
      location: remoteLocation(true, place),
      remote: true,
      tags: asStringList(record.tags),
      salary: formatSalaryRange(record.salary_min, record.salary_max, "USD", "year"),
      postedAt: toIsoDate(record.date) ?? toIsoDate(record.epoch),
      url,
      description: toPlainText(asString(record.description)),
    });
  }
  return jobs;
}
