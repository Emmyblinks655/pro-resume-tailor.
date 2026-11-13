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
    <article className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <p className="text-xs font-bold tracking-[0.16em] text-accent uppercase">{kicker}</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">{title}</h1>
      <div className="mt-6 space-y-4 text-base leading-7 text-ink-soft">{children}</div>
    </article>
  );
}
