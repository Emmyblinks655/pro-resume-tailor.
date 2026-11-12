import type { ReactNode } from "react";

export function AuthCard({
  kicker,
  title,
  lede,
  children,
}: {
  kicker: string;
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:py-14">
      <div className="rounded-[28px] border border-line bg-card px-4 py-6 shadow-[0_16px_40px_rgba(28,25,21,0.05)] sm:px-7 sm:py-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-copper uppercase">{kicker}</p>
        <h1 className="mt-3 font-display text-[2rem] leading-[1.15] tracking-tight sm:text-4xl">{title}</h1>
        {lede ? <p className="mt-3 text-base leading-7 text-ink-soft">{lede}</p> : null}
        {children}
      </div>
    </div>
  );
}
