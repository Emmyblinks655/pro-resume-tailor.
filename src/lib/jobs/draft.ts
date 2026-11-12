import type { Job } from "./types";

export const RESUME_DRAFT_KEY = "prt:resume";
export const JOB_DRAFT_KEY = "prt:job-draft";

export function jobDraftText(job: Pick<Job, "title" | "company" | "location" | "remote" | "salary" | "tags" | "description">): string {
  const where = job.remote && !/remote/i.test(job.location) ? `${job.location} (remote)` : job.location;
  const salary = job.salary ? `Salary: ${job.salary}\n` : "";
  const tags = job.tags.length ? `Skills: ${job.tags.join(", ")}\n` : "";
  return `${job.title} at ${job.company}\n${where}\n${salary}${tags}\n${job.description}`.trim();
}
