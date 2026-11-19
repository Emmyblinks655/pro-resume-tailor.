import { CheckoutButton } from "@/components/checkout-button";
import { SupportLink } from "@/components/support-link";
import { CREDIT_PACKS, PACK_PRICE_BUTTON, PACK_PRICE_LABEL } from "@/lib/packs";

const points = [
  "Five resume tailorings",
  `One payment of ${PACK_PRICE_LABEL}`,
  "Nothing renews when they are used",
  "ATS-safe PDF in US Letter or A4",
  "Your own words only — nothing invented",
];

export function PriceCard() {
  const pack = CREDIT_PACKS[0];
  if (!pack) return null;

  return (
    <article className="overflow-hidden rounded-[32px] border border-white/10 bg-card shadow-[0_30px_70px_-36px_rgba(18,36,28,0.55)]">
      <div className="bg-deep px-6 py-8 text-[#f6f3ec] sm:px-8">
        <p className="text-xs font-bold tracking-[0.16em] text-brass uppercase">One-time pack</p>
        <h2 className="mt-4 font-display text-5xl leading-none tracking-tight sm:text-6xl">
          {pack.priceLabel}
          <span className="ml-2 align-middle font-sans text-base font-semibold tracking-normal text-[#d5e4dc]">
            once
          </span>
        </h2>
        <p className="mt-3 text-base leading-7 text-[#d5e4dc]">{pack.blurb}</p>
      </div>
      <div className="px-6 py-6 sm:px-8 sm:py-7">
        <ul className="space-y-3 text-sm leading-6 text-ink">
          {points.map((point) => (
            <li key={point} className="flex gap-3">
              <span aria-hidden className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-highlight text-accent">
                <svg viewBox="0 0 16 16" className="size-3.5" fill="none">
                  <path d="M3.5 8.2 6.4 11l6.1-6.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {point}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <CheckoutButton packId={pack.id} label={PACK_PRICE_BUTTON} />
        </div>
        <p className="mt-3 text-center text-sm leading-6 text-ink-soft">Pay once. Nothing renews.</p>
        <p className="mt-1 text-center text-sm leading-6 text-ink-soft">
          Trouble paying? Email <SupportLink /> and we&apos;ll fix it fast.
        </p>
      </div>
    </article>
  );
}
