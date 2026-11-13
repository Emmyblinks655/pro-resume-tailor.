import type { Metadata } from "next";
import { Suspense } from "react";

import { primaryButtonClass, textFieldClass } from "@/components/field-styles";
import { JobResults } from "@/components/job-results";
import { parseJobQuery } from "@/lib/jobs/filter";
import { externalHttpUrl } from "@/lib/jobs/text";
import { searchJobs } from "@/lib/jobs/search";
import type { JobQuery, JobSearchResponse } from "@/lib/jobs/types";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Browse live job listings and open the tailor with a description already filled in.",
};

function JobsFallback() {
  return <p className="mx-auto max-w-5xl px-4 py-8 text-sm text-ink-soft">Loading jobs...</p>;
}

async function JobsContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseJobQuery(await searchParams);
  let result: JobSearchResponse;
  try {
    result = await searchJobs(query);
  } catch {
    result = { jobs: [], query, sources: [] };
  }
  return <JobsBoard query={query} result={result} />;
}

function JobsBoard({ query, result }: { query: JobQuery; result: JobSearchResponse }) {
  const failed = result.sources.filter((source) => !source.ok);
  return (
    <div className="mx-auto flex max-w-6xl flex-col px-4 py-10 sm:py-14">
      <p className="text-xs font-bold tracking-[0.16em] text-accent uppercase">Live listings</p>
      <h1 className="mt-3 max-w-2xl font-display text-4xl leading-tight tracking-tight sm:text-5xl">
        Find a job to tailor for
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-ink-soft">
        Listings come from Remotive, Arbeitnow, Himalayas, and Remote OK. Open the original posting
        on that board. We do not host the full listing.
      </p>

      <form
        action="/jobs"
        className="mt-8 grid gap-4 rounded-[28px] border border-line bg-card p-4 shadow-[0_22px_50px_-32px_rgba(18,36,28,0.45)] sm:grid-cols-2 sm:p-6"
      >
        <label className="text-sm font-semibold" htmlFor="q">
          Keyword
          <input
            id="q"
            name="q"
            defaultValue={query.keyword}
            placeholder="Role, skill, or company"
            className={textFieldClass}
          />
        </label>
        <label className="text-sm font-semibold" htmlFor="location">
          Location
          <input
            id="location"
            name="location"
            defaultValue={query.location}
            placeholder="City, country, or remote"
            className={textFieldClass}
          />
        </label>
        <label className="flex min-h-12 items-center gap-3 text-sm font-semibold" htmlFor="remote">
          <input
            id="remote"
            name="remote"
            type="checkbox"
            value="1"
            defaultChecked={query.remoteOnly}
            className="size-5 accent-copper"
          />
          Remote only
        </label>
        <label className="text-sm font-semibold" htmlFor="limit">
          Results
          <select id="limit" name="limit" defaultValue={String(query.limit)} className={textFieldClass}>
            <option value="3">3</option>
            <option value="6">6</option>
            <option value="12">12</option>
            <option value="20">20</option>
          </select>
        </label>
        <button type="submit" className={`${primaryButtonClass} sm:col-span-2`}>
          Search jobs
        </button>
      </form>

      <p className="mt-4 text-sm text-ink-soft">
        Showing {result.jobs.length} {result.jobs.length === 1 ? "listing" : "listings"}.
        {failed.length
          ? ` ${failed.map((source) => source.label).join(", ")} did not respond, so the rest are shown.`
          : ""}
      </p>

      <JobResults jobs={result.jobs} />

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="font-display text-2xl">Sources</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {result.sources.map((source) => {
            const sourceHref = externalHttpUrl(source.url);
            return (
            <li key={source.id} className="text-sm leading-6 text-ink-soft">
              {sourceHref ? (
                <a href={sourceHref} target="_blank" rel="noopener" className="font-semibold text-ink underline-offset-4 hover:underline">
                  {source.label}
                </a>
              ) : (
                <span className="font-semibold text-ink">{source.label}</span>
              )}
              {". "}
              {source.note}
            </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

export default function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<JobsFallback />}>
      <JobsContent searchParams={searchParams} />
    </Suspense>
  );
}
