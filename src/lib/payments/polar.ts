import { getPack } from "@/lib/packs";
import type { CheckoutRequest, CheckoutResult, PaymentProvider } from "@/lib/payments/types";

/**
 * Polar adapter stub. When checkout is connected, create a one-time checkout
 * with POLAR_ACCESS_TOKEN for the pack product and return its URL.
 * There is no subscription product and no trial.
 */
export const polarProvider: PaymentProvider = {
  id: "polar",
  label: "Polar",
  async createCheckout(input: CheckoutRequest): Promise<CheckoutResult> {
    const pack = getPack(input.packId);
    return {
      provider: "polar",
      status: "coming_soon",
      packId: input.packId,
      message: pack
        ? `Polar checkout is not connected yet. ${pack.name} would be a one-time charge of ${pack.priceLabel}. There is no trial and nothing will renew.`
        : "Unknown pack.",
    };
  },
};
