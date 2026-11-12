import Link from "next/link";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/settings", label: "Settings" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-display text-base leading-tight text-ink sm:text-lg">
          Pro Resume Tailor
        </Link>
        <Link
          href="/tailor"
          className="inline-flex min-h-11 items-center rounded-full bg-copper px-4 text-sm font-semibold text-white"
        >
          Tailor
        </Link>
      </div>
      <nav className="mx-auto flex max-w-5xl gap-5 overflow-x-auto px-4 pb-3 text-sm text-ink-soft">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="shrink-0 underline-offset-4 hover:underline">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
