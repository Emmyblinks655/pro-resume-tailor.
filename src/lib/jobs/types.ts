export type JobSourceId = "remotive" | "arbeitnow" | "himalayas" | "remoteok";

export type Job = {
  id: string;
  source: JobSourceId;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  tags: string[];
  salary: string | null;
  postedAt: string | null;
  url: string;
  description: string;
};

export type JobQuery = {
  keyword: string;
  location: string;
  remoteOnly: boolean;
  limit: number;
};

export type SourceAttribution = {
  id: JobSourceId;
  label: string;
  url: string;
  note: string;
};

export type SourceStatus = SourceAttribution & {
  ok: boolean;
  count: number;
  error?: string;
};

export type JobSearchResponse = {
  jobs: Job[];
  query: JobQuery;
  sources: SourceStatus[];
};

export const JOB_SOURCES: Record<JobSourceId, SourceAttribution> = {
  remotive: {
    id: "remotive",
    label: "Remotive",
    url: "https://remotive.com",
    note: "Remote jobs from the Remotive public API. Listings are delayed about 24 hours. Each job links back to Remotive.",
  },
  arbeitnow: {
    id: "arbeitnow",
    label: "Arbeitnow",
    url: "https://www.arbeitnow.com",
    note: "Jobs from the Arbeitnow job board API. Each job links back to Arbeitnow.",
  },
  himalayas: {
    id: "himalayas",
    label: "Himalayas",
    url: "https://himalayas.app",
    note: "Remote jobs from the Himalayas API. The view link is the Himalayas application link, unchanged.",
  },
  remoteok: {
    id: "remoteok",
    label: "Remote OK",
    url: "https://remoteok.com",
    note: "Jobs from the Remote OK API. Remote OK is the source, and each job links back to Remote OK.",
  },
};
