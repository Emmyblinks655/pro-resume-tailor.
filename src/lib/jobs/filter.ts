import type { Job, JobQuery } from "./types";

type RawParams = URLSearchParams | Record<string, string | string[] | undefined>;

function readParam(params: RawParams, key: string): string {
  if (params instanceof URLSearchParams) return params.get(key)?.trim() ?? "";
  const value = params[key];
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

export function parseJobQuery(params: RawParams): JobQuery {
  const rawLimit = Number(readParam(params, "limit"));
  let limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.round(rawLimit) : 12;
  if (limit < 3) limit = 3;
  if (limit > 20) limit = 20;
  const remote = readParam(params, "remote").toLowerCase();
  return {
    keyword: readParam(params, "q").slice(0, 80),
    location: readParam(params, "location").slice(0, 80),
    remoteOnly: remote === "1" || remote === "true" || remote === "on",
    limit,
  };
}

function haystack(job: Job): string {
  return `${job.title} ${job.company} ${job.location} ${job.tags.join(" ")} ${job.description}`.toLowerCase();
}

export function matchesJob(job: Job, query: JobQuery): boolean {
  if (query.remoteOnly && !job.remote) return false;
  if (query.location) {
    const needle = query.location.toLowerCase();
    const place = job.location.toLowerCase();
    const locationMatch =
      needle === "remote" ? job.remote || place.includes("remote") : place.includes(needle);
    if (!locationMatch) return false;
  }
  if (!query.keyword) return true;
  const text = haystack(job);
  const phrase = query.keyword.toLowerCase();
  if (text.includes(phrase)) return true;
  const words = phrase.split(/\s+/).filter((word) => word.length > 2);
  return words.length > 0 && words.every((word) => text.includes(word));
}

export function filterJobs(jobs: Job[], query: JobQuery): Job[] {
  return jobs.filter((job) => matchesJob(job, query)).slice(0, query.limit);
}
