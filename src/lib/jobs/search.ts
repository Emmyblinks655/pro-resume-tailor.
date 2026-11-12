import { cacheLife } from "next/cache";

import { dedupeJobs } from "./dedupe";
import { filterJobs } from "./filter";
import { fetchJobJson, JOBS_REVALIDATE_SECONDS, withTimeout } from "./http";
import { normaliseArbeitnow } from "./sources/arbeitnow";
import { normaliseHimalayas } from "./sources/himalayas";
import { normaliseRemoteOk } from "./sources/remoteok";
import { normaliseRemotive } from "./sources/remotive";
import { JOB_SOURCES, type Job, type JobQuery, type JobSearchResponse, type JobSourceId, type SourceStatus } from "./types";

const SOURCE_TIMEOUT_MS = 12_000;

const cacheWindow = {
  stale: 60 * 5,
  revalidate: JOBS_REVALIDATE_SECONDS,
  expire: 60 * 60 * 6,
} as const;

async function loadRemotive(keyword: string): Promise<Job[]> {
  "use cache";
  cacheLife(cacheWindow);
  const params = new URLSearchParams({ limit: "40" });
  if (keyword) params.set("search", keyword);
  return normaliseRemotive(await fetchJobJson(`https://remotive.com/api/remote-jobs?${params}`));
}

async function loadArbeitnow(): Promise<Job[]> {
  "use cache";
  cacheLife(cacheWindow);
  return normaliseArbeitnow(await fetchJobJson("https://www.arbeitnow.com/api/job-board-api?page=1"));
}

async function loadHimalayas(keyword: string): Promise<Job[]> {
  "use cache";
  cacheLife(cacheWindow);
  const url = keyword
    ? `https://himalayas.app/jobs/api/search?q=${encodeURIComponent(keyword)}&page=1`
    : "https://himalayas.app/jobs/api?limit=20";
  return normaliseHimalayas(await fetchJobJson(url));
}

async function loadRemoteOk(): Promise<Job[]> {
  "use cache";
  cacheLife(cacheWindow);
  return normaliseRemoteOk(await fetchJobJson("https://remoteok.com/api"));
}

const LOADERS: Array<{ id: JobSourceId; load: (query: JobQuery) => Promise<Job[]> }> = [
  { id: "remotive", load: (query) => loadRemotive(query.keyword) },
  { id: "arbeitnow", load: () => loadArbeitnow() },
  { id: "himalayas", load: (query) => loadHimalayas(query.keyword) },
  { id: "remoteok", load: () => loadRemoteOk() },
];

function failure(id: JobSourceId, error: unknown): SourceStatus & { jobs: Job[] } {
  const message = error instanceof Error ? error.message : "Source failed";
  return {
    ...JOB_SOURCES[id],
    ok: false,
    count: 0,
    error: message.slice(0, 160),
    jobs: [],
  };
}

export async function searchJobs(query: JobQuery): Promise<JobSearchResponse> {
  const loaded = await Promise.all(
    LOADERS.map(async (source) => {
      try {
        const jobs = await withTimeout(source.load(query), SOURCE_TIMEOUT_MS, JOB_SOURCES[source.id].label);
        return { ...JOB_SOURCES[source.id], ok: true as const, count: jobs.length, jobs };
      } catch (error) {
        return failure(source.id, error);
      }
    }),
  );

  const merged = dedupeJobs(loaded.flatMap((source) => source.jobs));
  merged.sort((a, b) => (b.postedAt ?? "").localeCompare(a.postedAt ?? ""));
  const jobs = filterJobs(merged, query);
  const included = new Map<JobSourceId, number>();
  for (const job of jobs) included.set(job.source, (included.get(job.source) ?? 0) + 1);

  return {
    jobs,
    query,
    sources: loaded.map((source) => ({
      id: source.id,
      label: source.label,
      url: source.url,
      note: source.note,
      ok: source.ok,
      count: included.get(source.id) ?? 0,
      ...(source.ok ? {} : { error: source.error }),
    })),
  };
}
