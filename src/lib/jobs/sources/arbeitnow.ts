import type { Job } from "../types";
import { asRecord, asString, asStringList, remoteLocation, toIsoDate, toPlainText } from "../text";

export function normaliseArbeitnow(payload: unknown): Job[] {
  const root = asRecord(payload);
  const rows = root && Array.isArray(root.data) ? root.data : [];
  const jobs: Job[] = [];
  for (const row of rows) {
    const record = asRecord(row);
    if (!record) continue;
    const title = asString(record.title);
    const company = asString(record.company_name);
    const url = asString(record.url);
    if (!title || !company || !url.startsWith("http")) continue;
    const remote = record.remote === true;
    const place = asString(record.location);
    const slug = asString(record.slug) || url;
    jobs.push({
      id: `arbeitnow:${slug}`,
      source: "arbeitnow",
      title,
      company,
      location: remoteLocation(remote, place),
      remote,
      tags: asStringList([...(Array.isArray(record.tags) ? record.tags : []), ...(Array.isArray(record.job_types) ? record.job_types : [])]),
      salary: null,
      postedAt: toIsoDate(record.created_at),
      url,
      description: toPlainText(asString(record.description)),
    });
  }
  return jobs;
}
