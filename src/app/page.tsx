import Link from "next/link";

import { FaqList } from "@/components/faq-list";
import { TAGLINE } from "@/lib/copy";

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

export default function HomePage() {
  return (
    <div>
      <section className="px-4 pt-8 pb-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold tracking-[0.16em] text-copper uppercase">
            Developers and freelancers
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-[2rem] leading-[1.1] text-ink sm:text-5xl">
            A role-specific resume, from the CV you already have.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink sm:text-lg">{TAGLINE}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tailor"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-copper px-6 text-base font-semibold text-white"
            >
              Tailor my resume
            </Link>
            <Link
              href="/pricing"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-line bg-card px-6 text-base font-semibold"
            >
              Five for $9
            </Link>
          </div>
          <p className="mt-4 text-sm font-semibold text-ink">No subscription, ever.</p>
        </div>
      </section>

      <section id="how" className="scroll-mt-28 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-3xl">How it works</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-3xl border border-line bg-card p-4">
                <p className="font-display text-3xl text-copper">{index + 1}</p>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 py-4">
        <div className="mx-auto max-w-5xl rounded-3xl bg-ink px-5 py-8 text-paper">
          <h2 className="font-display text-3xl leading-tight">No subscription, ever.</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#f3e6d8]">
            Five tailorings cost nine dollars. You pay once. When the credits are used, nothing renews
            and nothing is charged again. There is no trial that turns into a plan.
          </p>
          <Link
            href="/pricing"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-paper px-5 text-sm font-semibold text-ink"
          >
            See the one-time pack
          </Link>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
          <article className="rounded-3xl border border-line bg-card p-5">
            <h2 className="font-display text-2xl">It will not invent a career</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              The editor can rephrase, reorder, and emphasise. It cannot add an employer, a metric, or a
              tool you did not write down. Skills that also appear in the job are marked so you can see
              the match.
            </p>
          </article>
          <article className="rounded-3xl border border-line bg-card p-5">
            <h2 className="font-display text-2xl">Built for more than one market</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              United States, United Kingdom, Canada, Germany, and anywhere else you apply. Download US
              Letter or A4. The file is text, one column, with no tables or images, so an applicant
              tracking system can read it.
            </p>
          </article>
        </div>
      </section>

      <section id="faq" className="scroll-mt-28 px-4 py-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-3xl">FAQ</h2>
          <div className="mt-4">
            <FaqList />
          </div>
        </div>
      </section>
    </div>
  );
}
