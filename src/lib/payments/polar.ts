import type { CheckoutRequest, CheckoutResult, PaymentProvider } from "@/lib/payments/types";

/**
 * Polar adapter stub. The live pack checkout uses Paystack.
 * There is no subscription product and no trial.
 */
export const polarProvider: PaymentProvider = {
  id: "polar",
  label: "Polar",
  async createCheckout(input: CheckoutRequest): Promise<CheckoutResult> {
    return {
      provider: "polar",
      status: "unavailable",
      packId: input.packId,
      url: null,
    };
  },
};
