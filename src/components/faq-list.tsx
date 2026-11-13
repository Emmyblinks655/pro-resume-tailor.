import { FAQ } from "@/lib/copy";

export function FaqList() {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_22px_50px_-32px_rgba(18,36,28,0.45)]">
      {FAQ.map((item) => (
        <details key={item.question} className="group px-5 py-1 sm:px-6">
          <summary className="flex min-h-14 cursor-pointer list-none items-center py-3 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <span className="flex w-full items-start justify-between gap-4">
              {item.question}
              <span aria-hidden className="mt-0.5 text-xl leading-none text-accent group-open:rotate-45">
                +
              </span>
            </span>
          </summary>
          <p className="pb-5 text-sm leading-6 text-ink-soft">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
