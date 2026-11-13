import Link from "next/link";

import { FaqList } from "@/components/faq-list";
import { PriceCard } from "@/components/price-card";

const steps = [
  {
    title: "Add your resume",
    body: "Paste the text, or upload a PDF or DOCX. The words stay yours.",
  },
  {
    title: "Paste the job",
    body: "Drop in the description. The draft looks for skills you already listed.",
  },
  {
    title: "Download the PDF",
    body: "A single column of real text. No tables, no images. Letter or A4.",
  },
];

const assurances = ["Your words only", "ATS-safe PDF", "US Letter or A4"];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden px-4 pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.12fr_0.88fr]">
          <div>
            <p className="inline-flex min-h-8 items-center rounded-full border border-accent/20 bg-highlight px-3 text-xs font-bold tracking-[0.16em] text-accent uppercase">
              For developers and freelancers
            </p>
            <h1 className="mt-5 max-w-xl font-display text-[2.65rem] leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-[4.25rem]">
              A resume that reads like you wrote it for this job.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-ink-soft">
              Paste the CV you already have and the role you want. Pro Resume Tailor reorders and
              emphasises the skills you actually listed, then gives you a single-column PDF. Nothing
              invented. Five tailorings for $9, once.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tailor"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 text-base font-semibold text-white shadow-[0_14px_30px_-16px_rgba(11,110,79,0.95)] hover:bg-accent-deep"
              >
                Tailor my resume
              </Link>
              <Link
                href="/pricing"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-line bg-card px-6 text-base font-semibold shadow-sm hover:border-accent/30"
              >
                Get 5 tailorings for $9
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-ink-soft">
              {assurances.map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <HeroSheet />
        </div>
      </section>

      <section id="how" className="scroll-mt-24 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold tracking-[0.16em] text-accent uppercase">How it works</p>
          <h2 className="mt-3 max-w-xl font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Three steps. Then a PDF you can send.
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-[28px] border border-line bg-card p-6 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_22px_50px_-28px_rgba(18,36,28,0.4)]"
              >
                <p className="font-display text-4xl text-accent">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 py-4">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          <article className="rounded-[28px] border border-line bg-card p-6 shadow-[0_22px_50px_-28px_rgba(18,36,28,0.4)] sm:p-8">
            <h2 className="font-display text-3xl tracking-tight">It will not invent a career</h2>
            <p className="mt-3 text-base leading-7 text-ink-soft">
              The editor can rephrase, reorder, and emphasise. It cannot add an employer, a metric, or a
              tool you did not write down. Skills that also appear in the job are marked so you can see
              the match.
            </p>
          </article>
          <article className="rounded-[28px] border border-line bg-card p-6 shadow-[0_22px_50px_-28px_rgba(18,36,28,0.4)] sm:p-8">
            <h2 className="font-display text-3xl tracking-tight">Built for more than one market</h2>
            <p className="mt-3 text-base leading-7 text-ink-soft">
              United States, United Kingdom, Canada, Germany, and anywhere else you apply. Download US
              Letter or A4. The file is text, one column, with no tables or images, so an applicant
              tracking system can read it.
            </p>
          </article>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-24 px-4 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_minmax(0,28rem)]">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-accent uppercase">Pricing</p>
            <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Five tailorings. Nine dollars. Once.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-ink-soft">
              No subscription and no trial that turns into a plan. Use the tailorings when you apply.
              When they are gone, nothing is charged again.
            </p>
          </div>
          <PriceCard />
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold tracking-[0.16em] text-accent uppercase">FAQ</p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">Questions, answered plainly.</h2>
          <div className="mt-6 max-w-3xl">
            <FaqList />
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroSheet() {
  const skills = ["React", "TypeScript", "Next.js"];
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="absolute -top-6 -right-3 -z-10 h-40 w-40 rounded-full bg-accent/15 blur-2xl" />
      <div className="absolute -bottom-8 -left-4 -z-10 h-36 w-36 rounded-full bg-brass/40 blur-2xl" />
      <article className="rounded-[32px] border border-line bg-card p-6 shadow-[0_30px_70px_-36px_rgba(18,36,28,0.55)] sm:p-8">
        <p className="font-display text-2xl tracking-tight">Amina Okonkwo</p>
        <p className="mt-1 text-sm text-ink-soft">Frontend developer</p>
        <p className="mt-6 text-xs font-bold tracking-[0.16em] text-accent uppercase">Skills brought forward</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li key={skill} className="rounded-full bg-highlight px-3 py-1 text-sm font-semibold text-accent">
              {skill}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs font-bold tracking-[0.16em] text-accent uppercase">Experience</p>
        <p className="mt-2 text-sm font-semibold">Senior frontend, Northwind</p>
        <p className="mt-1 text-sm leading-6 text-ink-soft">Shipped a design system used by 12 product teams.</p>
        <p className="mt-6 rounded-2xl bg-highlight px-4 py-3 text-sm leading-6 text-ink">
          Nothing invented. Your words, reordered for this role.
        </p>
      </article>
    </div>
  );
}
