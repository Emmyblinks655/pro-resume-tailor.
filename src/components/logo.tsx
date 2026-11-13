import Link from "next/link";

export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0B6E4F" />
      <rect x="7.36" y="5.44" width="13.76" height="18.24" rx="2.2" fill="#F6F3EC" />
      <path
        d="M10.24 10.24h7.68M10.24 13.76h7.68M10.24 17.28h4.48"
        stroke="#0B6E4F"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <path
        d="M16 17.92 19.84 22.4 26.88 12.8"
        fill="none"
        stroke="#F3D48A"
        strokeWidth="2.24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ tone = "ink" }: { tone?: "ink" | "inverse" }) {
  const lead = tone === "inverse" ? "text-[#f6f3ec]" : "text-ink";
  const accent = tone === "inverse" ? "text-brass" : "text-accent";
  return (
    <span className={`font-display text-[1.05rem] leading-none tracking-tight sm:text-lg ${lead}`}>
      Pro Resume <span className={accent}>Tailor</span>
    </span>
  );
}

export function BrandLink({ tone = "ink" }: { tone?: "ink" | "inverse" }) {
  return (
    <Link href="/" className="inline-flex min-h-12 items-center gap-2.5 rounded-2xl pr-1">
      <LogoMark />
      <Wordmark tone={tone} />
    </Link>
  );
}
