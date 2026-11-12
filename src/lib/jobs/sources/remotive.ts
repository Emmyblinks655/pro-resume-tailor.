import type { Job } from "../types";
import { asRecord, asString, asStringList, remoteLocation, salaryText, toIsoDate, toPlainText } from "../text";

export function normaliseRemotive(payload: unknown): Job[] {
  const root = asRecord(payload);
  const rows = root && Array.isArray(root.jobs) ? root.jobs : [];
  const jobs: Job[] = [];
  for (const row of rows) {
    const record = asRecord(row);
    if (!record) continue;
    const title = asString(record.title);
    const company = asString(record.company_name);
    const url = asString(record.url);
    if (!title || !company || !url.startsWith("http")) continue;
    const id = record.id == null ? url : String(record.id);
    const tags = asStringList([record.category, ...(Array.isArray(record.tags) ? record.tags : [])]);
    const place = asString(record.candidate_required_location);
    jobs.push({
      id: `remotive:${id}`,
      source: "remotive",
      title,
      company,
      location: remoteLocation(true, place),
      remote: true,
      tags,
      salary: salaryText(record.salary),
      postedAt: toIsoDate(record.publication_date),
      url,
      description: toPlainText(asString(record.description)),
    });
  }
  return jobs;
}
