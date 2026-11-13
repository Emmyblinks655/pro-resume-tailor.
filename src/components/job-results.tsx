"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { JOB_DRAFT_KEY, RESUME_DRAFT_KEY, jobDraftText } from "@/lib/jobs/draft";
import { keywordOverlapRanker } from "@/lib/jobs/fit";
import { excerpt, externalHttpUrl, formatPosted } from "@/lib/jobs/text";
import { JOB_SOURCES, type Job } from "@/lib/jobs/types";

export function JobResults({ jobs }: { jobs: Job[] }) {
  const router = useRouter();
  const [resume, setResume] = useState("");
  const ranked = keywordOverlapRanker(resume, jobs);
  const scored = ranked.some((job) => job.fit);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = sessionStorage.getItem(RESUME_DRAFT_KEY);
        if (saved) setResume(saved);
      } catch {
        // The fit score stays hidden when storage is blocked.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function onResume(value: string) {
    setResume(value);
    try {
      if (value.trim()) sessionStorage.setItem(RESUME_DRAFT_KEY, value);
      else sessionStorage.removeItem(RESUME_DRAFT_KEY);
    } catch {
      // The score still updates for this view.
    }
  }

  function tailor(job: Job) {
    try {
      sessionStorage.setItem(JOB_DRAFT_KEY, jobDraftText(job));
      if (resume.trim()) sessionStorage.setItem(RESUME_DRAFT_KEY, resume);
    } catch {
      // The tailor page still opens; the description may need to be pasted.
    }
    router.push("/tailor");
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <label className="block text-sm font-semibold" htmlFor="resume-fit">
        Paste your resume for a keyword fit score
        <textarea
          id="resume-fit"
          value={resume}
          onChange={(event) => onResume(event.target.value)}
          className="mt-2 min-h-28 w-full rounded-2xl border border-line bg-card px-4 py-3 text-base leading-6 font-normal text-ink"
          placeholder="Paste the same resume you would tailor. It stays in this browser."
        />
      </label>
      <p className="text-sm leading-6 text-ink-soft">
        {scored
          ? "Fit is keyword overlap between your resume and the listing. It is not an AI score."
          : "Add a few lines of your resume to see which listings share your keywords."}
      </p>

      {ranked.length === 0 ? (
        <p className="rounded-[28px] border border-line bg-card px-4 py-4 text-sm leading-6">
          No listings matched. Try a broader keyword, or clear the location filter.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {ranked.map((job) => {
            const viewUrl = externalHttpUrl(job.url);
            return (
            <li key={job.id} className="rounded-[28px] border border-line bg-card p-5 shadow-[0_22px_50px_-32px_rgba(18,36,28,0.45)]">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={JOB_SOURCES[job.source].url}
                  target="_blank"
                  rel="noopener"
                  className="rounded-full bg-highlight px-2.5 py-1 text-xs font-semibold text-ink"
                >
                  {JOB_SOURCES[job.source].label}
                </a>
                <time dateTime={job.postedAt ?? undefined} className="text-xs text-ink-soft">
                  {formatPosted(job.postedAt)}
                </time>
              </div>
              <h2 className="mt-2 font-display text-2xl leading-tight">{job.title}</h2>
              <p className="mt-1 text-sm font-semibold">{job.company}</p>
              <p className="mt-1 text-sm text-ink-soft">{job.location}</p>
              {job.salary ? <p className="mt-1 text-sm text-ink-soft">{job.salary}</p> : null}
              {job.fit ? (
                <p className="mt-3 text-sm leading-6">
                  <span className="font-semibold text-ink">Fit {job.fit.percent}%</span>
                  <span className="text-ink-soft"> · keyword overlap</span>
                  {job.fit.matched.length ? (
                    <span className="text-ink-soft"> · {job.fit.matched.join(", ")}</span>
                  ) : null}
                </p>
              ) : null}
              <p className="mt-3 text-sm leading-6 text-ink-soft">{excerpt(job.description)}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {viewUrl ? (
                  <a
                    href={viewUrl}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-line bg-paper px-4 text-sm font-semibold"
                  >
                    View job
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => tailor(job)}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-deep"
                >
                  Tailor my resume for this job
                </button>
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
