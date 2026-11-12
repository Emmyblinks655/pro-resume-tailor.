import assert from "node:assert/strict";
import test from "node:test";

import { dedupeJobs } from "./dedupe";
import { parseJobQuery } from "./filter";
import { normaliseArbeitnow } from "./sources/arbeitnow";
import { normaliseHimalayas } from "./sources/himalayas";
import { normaliseRemoteOk } from "./sources/remoteok";
import { normaliseRemotive } from "./sources/remotive";
import { toPlainText } from "./text";

test("remote ok titles repair utf-8 dashes", () => {
  const [job] = normaliseRemoteOk([
    {
      id: "1",
      position: "Engineer \u00e2\u0080\u0094 Platform",
      company: "Acme",
      url: "https://remoteok.com/remote-jobs/1",
      description: "<p>Build it.</p>",
    },
  ]);
  assert.equal(job?.title, "Engineer — Platform");
});

test("plain text drops tags, scripts, and entities", () => {
  const text = toPlainText("<p>Hello</p><script>alert(1)</script><p>World &amp; co</p>");
  assert.equal(text.includes("alert"), false);
  assert.equal(text.includes("<"), false);
  assert.match(text, /Hello/);
  assert.match(text, /World & co/);
});

test("remotive maps a listing and keeps the Remotive url", () => {
  const [job] = normaliseRemotive({
    jobs: [
      {
        id: 11,
        url: "https://remotive.com/remote-jobs/product/lead-11",
        title: "Lead Developer",
        company_name: "Northwind",
        category: "Software Development",
        tags: ["react", "node"],
        publication_date: "2026-02-01T10:00:00",
        candidate_required_location: "USA",
        salary: "$100k",
        description: "<p>Build <b>APIs</b>.</p>",
      },
    ],
  });
  assert.equal(job?.id, "remotive:11");
  assert.equal(job?.source, "remotive");
  assert.equal(job?.company, "Northwind");
  assert.equal(job?.remote, true);
  assert.equal(job?.location, "Remote · USA");
  assert.equal(job?.salary, "$100k");
  assert.equal(job?.url, "https://remotive.com/remote-jobs/product/lead-11");
  assert.equal(job?.description, "Build APIs.");
  assert.deepEqual(job?.tags, ["Software Development", "react", "node"]);
});

test("arbeitnow reads the paginated data array", () => {
  const [job] = normaliseArbeitnow({
    data: [
      {
        slug: "backend-berlin",
        company_name: "Acme GmbH",
        title: "Backend Engineer",
        description: "<p>APIs in Berlin.</p>",
        remote: false,
        url: "https://www.arbeitnow.com/jobs/companies/acme/backend-berlin",
        tags: ["Engineering"],
        job_types: ["fulltime"],
        location: "Berlin, Germany",
        created_at: 1_700_000_000,
      },
    ],
  });
  assert.equal(job?.source, "arbeitnow");
  assert.equal(job?.remote, false);
  assert.equal(job?.location, "Berlin, Germany");
  assert.equal(job?.postedAt, "2023-11-14T22:13:20.000Z");
  assert.deepEqual(job?.tags, ["Engineering", "fulltime"]);
});

test("himalayas uses the application link and salary fields", () => {
  const [job] = normaliseHimalayas({
    jobs: [
      {
        title: "Support Engineer",
        companyName: "Askable",
        description: "<p>Help customers.</p>",
        minSalary: 100,
        maxSalary: 120,
        salaryPeriod: "hourly",
        currency: "USD",
        locationRestrictions: [],
        parentCategories: ["Developer"],
        pubDate: 1_700_000_000,
        applicationLink: "https://himalayas.app/companies/askable/jobs/support?utm_source=api",
        guid: "https://himalayas.app/companies/askable/jobs/support",
      },
    ],
  });
  assert.equal(job?.url, "https://himalayas.app/companies/askable/jobs/support?utm_source=api");
  assert.equal(job?.salary, "USD 100-120/hour");
  assert.equal(job?.location, "Remote · Worldwide");
  assert.equal(job?.remote, true);
});

test("remote ok skips the legal notice and zeroes empty salary", () => {
  const jobs = normaliseRemoteOk([
    { legal: "Please link back to Remote OK.", last_updated: 1 },
    {
      id: "99",
      position: "Designer",
      company: "Fjord",
      tags: ["figma"],
      description: "<p>Design systems.</p>",
      date: "2026-03-01T00:00:00+00:00",
      url: "https://remoteok.com/remote-jobs/remote-designer-fjord-99",
      salary_min: 0,
      salary_max: 0,
      location: "",
    },
  ]);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0]?.source, "remoteok");
  assert.equal(jobs[0]?.title, "Designer");
  assert.equal(jobs[0]?.salary, null);
  assert.equal(jobs[0]?.location, "Remote");
  assert.equal(jobs[0]?.url, "https://remoteok.com/remote-jobs/remote-designer-fjord-99");
});

test("dedupes the same company and title across sources", () => {
  const jobs = dedupeJobs([
    {
      id: "a",
      source: "remotive",
      title: "Backend Engineer",
      company: "Acme",
      location: "Remote",
      remote: true,
      tags: [],
      salary: null,
      postedAt: null,
      url: "https://remotive.com/job",
      description: "Short",
    },
    {
      id: "b",
      source: "remoteok",
      title: "Backend Engineer!",
      company: "acme",
      location: "Remote",
      remote: true,
      tags: [],
      salary: "USD 100,000/year",
      postedAt: null,
      url: "https://remoteok.com/job",
      description: "A longer description of the same role.",
    },
  ]);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0]?.source, "remoteok");
  assert.equal(jobs[0]?.salary, "USD 100,000/year");
});

test("limit stays between 3 and 20", () => {
  assert.equal(parseJobQuery(new URLSearchParams("limit=1")).limit, 3);
  assert.equal(parseJobQuery(new URLSearchParams("limit=50")).limit, 20);
  assert.equal(parseJobQuery(new URLSearchParams("remote=1")).remoteOnly, true);
});
