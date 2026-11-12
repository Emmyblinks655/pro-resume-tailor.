import { tokens } from "@/lib/resume/text";

import type { Job } from "./types";

export type FitScore = {
  /** Keyword overlap today. An AI ranker can return method: "ai" later. */
  method: "keyword-overlap";
  percent: number;
  matched: string[];
};

export type RankedJob = Job & { fit: FitScore | null };

export type JobRanker = (resumeText: string, jobs: Job[]) => RankedJob[];

const EXTRA_STOP = new Set(
  "job role work team company remote full time senior junior lead manager engineer developer specialist".split(" "),
);

function skillTokens(job: Pick<Job, "title" | "tags" | "description">): string[] {
  const fromTags = job.tags.flatMap((tag) => tag.toLowerCase().split(/[^a-z0-9+#.]+/));
  const fromTitle = (job.title.toLowerCase().match(/[a-z0-9+#.]+/g) ?? []).filter((token) => token.length > 3);
  const fromBody = tokens(job.description).filter((token) => token.length > 4);
  const unique: string[] = [];
  for (const token of [...fromTags, ...fromTitle, ...fromBody]) {
    if (token.length < 3 || EXTRA_STOP.has(token)) continue;
    if (unique.includes(token)) continue;
    unique.push(token);
    if (unique.length >= 15) break;
  }
  return unique;
}

function resumeHas(token: string, resumeTokens: Set<string>): boolean {
  if (resumeTokens.has(token)) return true;
  if (token.length < 5) return false;
  for (const word of resumeTokens) {
    if (word.length < 5) continue;
    if (word.startsWith(token) || token.startsWith(word)) return true;
  }
  return false;
}

/** Share of job skills that also appear in the pasted resume. Not an AI score. */
export function scoreFit(resumeText: string, job: Pick<Job, "title" | "tags" | "description">): FitScore | null {
  const resumeTokens = new Set(tokens(resumeText));
  if (resumeTokens.size < 8) return null;
  const skills = skillTokens(job);
  if (skills.length === 0) return null;
  const matched = skills.filter((token) => resumeHas(token, resumeTokens));
  const percent = Math.min(100, Math.round((matched.length / skills.length) * 100));
  return { method: "keyword-overlap", percent, matched: matched.slice(0, 6) };
}

/** Default ranker. Swap this for an AI ranker later without changing the page. */
export const keywordOverlapRanker: JobRanker = (resumeText, jobs) => {
  const ranked = jobs.map((job) => ({ ...job, fit: scoreFit(resumeText, job) }));
  if (!ranked.some((job) => job.fit)) return ranked;
  return [...ranked].sort((a, b) => (b.fit?.percent ?? -1) - (a.fit?.percent ?? -1));
};
