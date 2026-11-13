import Link from "next/link";

import { BrandLink } from "@/components/logo";
import { PACK_PRICE_LABEL } from "@/lib/packs";

const product = [
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/jobs", label: "Jobs" },
  { href: "/tailor", label: "Tailor a resume" },
];

const legal = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund", label: "Refunds" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-deep text-[#d5e4dc]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <BrandLink tone="inverse" />
          <p className="mt-4 max-w-sm text-sm leading-6">
            Role-specific resumes for developers and freelancers. Your words, reordered for the job.
            Five tailorings for {PACK_PRICE_LABEL}, once.
          </p>
        </div>
        <nav aria-label="Product">
          <p className="text-xs font-bold tracking-[0.16em] text-brass uppercase">Product</p>
          <ul className="mt-3 space-y-1">
            {product.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-11 items-center text-sm font-semibold text-[#f6f3ec] hover:text-brass">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Legal">
          <p className="text-xs font-bold tracking-[0.16em] text-brass uppercase">Legal</p>
          <ul className="mt-3 space-y-1">
            {legal.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-11 items-center text-sm font-semibold text-[#f6f3ec] hover:text-brass">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-sm">© 2026 Pro Resume Tailor</p>
      </div>
    </footer>
  );
}
