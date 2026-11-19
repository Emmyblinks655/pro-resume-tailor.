import type { ReactNode } from "react";

import { SUPPORT_EMAIL, supportMailto } from "@/lib/support";

const tones = {
  accent: "text-accent decoration-accent/30 hover:text-accent-deep",
  inverse: "text-[#f6f3ec] decoration-white/30 hover:text-brass",
} as const;

export function SupportLink({
  tone = "accent",
  subject,
  children,
}: {
  tone?: keyof typeof tones;
  subject?: string;
  children?: ReactNode;
}) {
  return (
    <a href={supportMailto(subject)} className={`font-semibold break-words underline underline-offset-4 ${tones[tone]}`}>
      {children ?? SUPPORT_EMAIL}
    </a>
  );
}
