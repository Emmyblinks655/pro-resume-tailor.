import type { Job } from "./types";

function keyFor(job: Job): string {
  const company = job.company.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const title = job.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return `${company}|${title}`;
}

/** Keep one listing per company + title. Prefer the copy with more description text. */
export function dedupeJobs(jobs: Job[]): Job[] {
  const seen = new Map<string, Job>();
  for (const job of jobs) {
    const key = keyFor(job);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, job);
      continue;
    }
    const salary = existing.salary ?? job.salary;
    if (job.description.length > existing.description.length) {
      seen.set(key, { ...job, salary });
    } else if (!existing.salary && job.salary) {
      seen.set(key, { ...existing, salary: job.salary });
    }
  }
  return [...seen.values()];
}
