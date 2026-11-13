"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ResumePreview } from "@/components/resume-preview";
import type { TailorSuccess } from "@/lib/ai/types";
import type { CreditBalance } from "@/lib/credits/types";
import { JOB_DRAFT_KEY, RESUME_DRAFT_KEY } from "@/lib/jobs/draft";
import { SAMPLE_JOB, SAMPLE_RESUME } from "@/lib/sample-data";
import type { PageSize } from "@/lib/resume/types";

const fieldClass =
  "mt-2 min-h-36 w-full rounded-2xl border border-line bg-paper px-4 py-3 text-base leading-6 text-ink shadow-sm";

const panelClass =
  "rounded-[28px] border border-line bg-card p-4 shadow-[0_22px_50px_-32px_rgba(18,36,28,0.4)] sm:p-6";

type StatusPayload = {
  credits: CreditBalance;
};

export function TailorStudio() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [result, setResult] = useState<TailorSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"extract" | "tailor" | "pdf" | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [view, setView] = useState<"after" | "before">("after");
  const [pageSize, setPageSize] = useState<PageSize>("letter");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/credits")
      .then((response) => response.json())
      .then((data: StatusPayload) => {
        if (!cancelled) setCredits(data.credits);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your tailorings.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const draft = sessionStorage.getItem(JOB_DRAFT_KEY);
        if (draft) {
          setJobDescription(draft);
          sessionStorage.removeItem(JOB_DRAFT_KEY);
        }
        const savedResume = sessionStorage.getItem(RESUME_DRAFT_KEY);
        if (savedResume) {
          setResumeText((current) => (current.trim() ? current : savedResume));
        }
      } catch {
        // The form still works when storage is blocked.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!resumeText.trim()) return;
    try {
      sessionStorage.setItem(RESUME_DRAFT_KEY, resumeText);
    } catch {
      // Ignore storage failures.
    }
  }, [resumeText]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setPending("extract");
    setError(null);
    setFileName(file.name);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/extract", { method: "POST", body });
      const data = (await response.json()) as { text?: string; error?: string };
      if (!response.ok || !data.text) {
        setError(data.error ?? "Could not read that file.");
        return;
      }
      setResumeText(data.text);
    } catch {
      setError("Could not read that file.");
    } finally {
      setPending(null);
    }
  }

  async function tailor() {
    setPending("tailor");
    setError(null);
    try {
      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const data = (await response.json()) as TailorSuccess & { error?: string; credits?: CreditBalance };
      if (data.credits) setCredits(data.credits);
      if (!response.ok || !data.resume) {
        setError(data.error ?? "The tailor could not finish.");
        return;
      }
      setResult(data);
      setView("after");
      document.getElementById("preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setError("The tailor could not finish.");
    } finally {
      setPending(null);
    }
  }

  async function downloadPdf() {
    if (!result) return;
    setPending("pdf");
    setError(null);
    try {
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: result.resume, pageSize }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Could not build the PDF.");
        return;
      }
      const blob = await response.blob();
      const header = response.headers.get("Content-Disposition") ?? "";
      const match = header.match(/filename="([^"]+)"/);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = match?.[1] ?? "resume-tailored.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not build the PDF.");
    } finally {
      setPending(null);
    }
  }

  const blocked = credits !== null && credits.remaining < 1;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:py-14">
      <div>
        <p className="text-xs font-bold tracking-[0.16em] text-accent uppercase">Tailor</p>
        <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-ink sm:text-5xl">
          Tailor your resume
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-ink-soft">
          Paste a resume or upload a PDF or DOCX, paste the job, then tailor it once. The draft only
          rearranges what you supplied.
        </p>
      </div>

      {credits ? (
        <p className="text-sm leading-6 text-ink-soft">
          <span className="font-semibold text-ink">{credits.remaining}</span>{" "}
          {credits.remaining === 1 ? "tailoring" : "tailorings"} left.{" "}
          <Link href="/pricing" className="font-semibold text-accent underline-offset-4 hover:underline">
            Get 5 tailorings for $9
          </Link>
        </p>
      ) : (
        <p className="text-sm text-ink-soft">Loading your tailorings…</p>
      )}

      <section className={panelClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl">1. Your resume</h2>
          <button
            type="button"
            className="min-h-11 rounded-full border border-line bg-card px-4 text-sm font-semibold"
            onClick={() => {
              setResumeText(SAMPLE_RESUME);
              setJobDescription(SAMPLE_JOB);
              setFileName(null);
              setError(null);
            }}
          >
            Load a sample
          </button>
        </div>
        <label className="mt-4 block text-sm font-semibold" htmlFor="resume">
          Paste the resume text
        </label>
        <textarea
          id="resume"
          value={resumeText}
          onChange={(event) => setResumeText(event.target.value)}
          className={fieldClass}
          placeholder="Name, roles, and bullets."
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-line bg-card px-4 text-sm font-semibold">
            {pending === "extract" ? "Reading file..." : "Upload PDF or DOCX"}
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                void onFile(file);
                event.target.value = "";
              }}
            />
          </label>
          {fileName ? <span className="text-sm text-ink-soft">{fileName}</span> : null}
        </div>
      </section>

      <section className={panelClass}>
        <h2 className="font-display text-2xl">2. The job</h2>
        <label className="mt-4 block text-sm font-semibold" htmlFor="job">
          Paste the job description
        </label>
        <textarea
          id="job"
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          className={fieldClass}
          placeholder="Responsibilities and the skills the role asks for."
        />
      </section>

      {error ? (
        <p role="alert" className="rounded-2xl border border-danger/25 bg-[#f8ece8] px-4 py-3 text-sm leading-6">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void tailor()}
        disabled={pending !== null || blocked}
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 text-base font-semibold text-white shadow-[0_14px_30px_-16px_rgba(11,110,79,0.95)] hover:bg-accent-deep disabled:opacity-60"
      >
        {pending === "tailor" ? "Tailoring..." : "Tailor resume"}
      </button>
      {blocked ? (
        <p className="text-sm leading-6 text-ink-soft">
          You have no tailorings left.{" "}
          <Link href="/pricing" className="font-semibold text-accent underline-offset-4 hover:underline">
            Get 5 tailorings for $9
          </Link>
        </p>
      ) : null}

      {result ? (
        <section id="preview" className="scroll-mt-28">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">3. Preview</h2>
              <p className="mt-1 text-sm text-ink-soft">Ready to download as a single-column PDF.</p>
            </div>
            <div className="flex rounded-full border border-line bg-card p-1 sm:hidden" role="tablist" aria-label="Preview">
              <button
                type="button"
                role="tab"
                aria-selected={view === "after"}
                className={`min-h-11 rounded-full px-4 text-sm font-semibold ${view === "after" ? "bg-ink text-paper" : ""}`}
                onClick={() => setView("after")}
              >
                Tailored
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === "before"}
                className={`min-h-11 rounded-full px-4 text-sm font-semibold ${view === "before" ? "bg-ink text-paper" : ""}`}
                onClick={() => setView("before")}
              >
                Original
              </button>
            </div>
          </div>

          {result.warnings.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-soft">
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className={view === "before" ? "block" : "hidden sm:block"}>
              <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-ink-soft uppercase">Original</p>
              <pre className="max-h-[40rem] overflow-auto rounded-3xl border border-line bg-card p-4 text-sm leading-6 whitespace-pre-wrap">
                {resumeText}
              </pre>
            </div>
            <div className={view === "after" ? "block" : "hidden sm:block"}>
              <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-ink-soft uppercase">Tailored</p>
              <ResumePreview resume={result.resume} />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="text-sm font-semibold" htmlFor="page-size">
              PDF page size
              <select
                id="page-size"
                value={pageSize}
                onChange={(event) => setPageSize(event.target.value === "a4" ? "a4" : "letter")}
                className="mt-1 block min-h-12 w-full rounded-2xl border border-line bg-card px-3 text-base sm:w-48"
              >
                <option value="letter">US Letter</option>
                <option value="a4">A4</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => void downloadPdf()}
              disabled={pending !== null}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-deep px-6 text-base font-semibold text-[#f6f3ec] disabled:opacity-60 sm:mt-6"
            >
              {pending === "pdf" ? "Preparing PDF..." : "Download PDF"}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
