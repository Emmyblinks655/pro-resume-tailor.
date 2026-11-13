import type { Metadata } from "next";

import { PriceCard } from "@/components/price-card";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Five resume tailorings for ₦9,900, paid once. No trial and no subscription.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1fr_minmax(0,28rem)]">
      <div>
        <p className="text-xs font-bold tracking-[0.16em] text-accent uppercase">One-time credits</p>
        <h1 className="mt-3 max-w-xl font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          One payment. Five tailorings. Then it stops.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-ink-soft">
          There is no trial that turns into a subscription. You are not starting a plan. You buy a pack of
          credits, use them when you want, and nothing renews.
        </p>
      </div>
      <PriceCard />
    </div>
  );
}
