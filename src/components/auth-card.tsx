import type { ReactNode } from "react";

import { LogoMark } from "@/components/logo";

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
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
      <div className="rounded-[32px] border border-line bg-card px-5 py-7 shadow-[0_30px_70px_-36px_rgba(18,36,28,0.5)] sm:px-8 sm:py-9">
        <LogoMark className="size-11" />
        <p className="mt-5 text-xs font-bold tracking-[0.16em] text-accent uppercase">{kicker}</p>
        <h1 className="mt-3 font-display text-[2rem] leading-[1.12] tracking-tight sm:text-4xl">{title}</h1>
        {lede ? <p className="mt-3 text-base leading-7 text-ink-soft">{lede}</p> : null}
        {children}
      </div>
    </div>
  );
}
