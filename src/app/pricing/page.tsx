import type { Metadata } from "next";

import { CheckoutButton } from "@/components/checkout-button";
import { CREDIT_PACKS } from "@/lib/packs";
import { getPaymentProvider } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Five resume tailorings for nine dollars, paid once. No trial and no subscription.",
};

export default function PricingPage() {
  const provider = getPaymentProvider();
  const pack = CREDIT_PACKS[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs font-semibold tracking-[0.16em] text-copper uppercase">One-time credits</p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight">
        One payment. Five tailorings. Then it stops.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-ink-soft">
        There is no trial that turns into a subscription. You are not starting a plan. You buy a pack of
        credits, use them when you want, and nothing renews.
      </p>

      <article className="mt-8 max-w-md rounded-3xl border border-line bg-card p-5">
        <h2 className="font-display text-2xl">{pack.name}</h2>
        <p className="mt-2 font-display text-5xl text-ink">
          {pack.priceLabel}
          <span className="ml-2 align-middle text-base font-sans font-semibold text-ink-soft">once</span>
        </p>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-ink-soft">
          <li>{pack.credits} resume tailorings</li>
          <li>Priced at {pack.priceLabel} USD</li>
          <li>Credits do not auto-renew</li>
          <li>No trial, no monthly plan, no card stored in this preview</li>
        </ul>
        <CheckoutButton packId={pack.id} />
        <p className="mt-4 text-sm leading-6 text-ink-soft">
          Checkout adapter: {provider.label}. It is not connected, so this button cannot take a payment.
        </p>
      </article>

      <section className="mt-8 max-w-2xl rounded-3xl bg-highlight px-5 py-5 text-sm leading-6">
        <h2 className="font-display text-2xl text-ink">What you are not buying</h2>
        <p className="mt-2">
          Not a subscription. Not a free week that becomes a charge. Not a seat that renews next month.
          When real checkout ships, a pack is still a single charge. Unused purchased credits are meant
          to stay until you use them. The refund page is a draft until payments are live.
        </p>
      </section>
    </div>
  );
}
