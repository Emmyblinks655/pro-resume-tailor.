import { FAQ } from "@/lib/copy";

export function FaqList() {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card">
      {FAQ.map((item) => (
        <details key={item.question} className="group px-4 py-1">
          <summary className="cursor-pointer list-none py-3 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <span className="flex items-start justify-between gap-4">
              {item.question}
              <span aria-hidden className="text-copper group-open:rotate-45">
                +
              </span>
            </span>
          </summary>
          <p className="pb-4 text-sm leading-6 text-ink-soft">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
