import type { ReactNode } from "react";

export function Legal({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-xs font-semibold tracking-[0.16em] text-copper uppercase">{kicker}</p>
      <h1 className="mt-3 font-display text-4xl">{title}</h1>
      <div className="mt-4 space-y-4 text-base leading-7 text-ink-soft">{children}</div>
    </article>
  );
}
