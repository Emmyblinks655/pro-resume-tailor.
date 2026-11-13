import { getPack } from "@/lib/packs";
import type { CheckoutRequest, CheckoutResult, PaymentProvider } from "@/lib/payments/types";

/**
 * Paystack adapter stub. When checkout is connected, initialize a one-time
 * transaction with PAYSTACK_SECRET_KEY. There is no plan and no trial.
 */
export const paystackProvider: PaymentProvider = {
  id: "paystack",
  label: "Paystack",
  async createCheckout(input: CheckoutRequest): Promise<CheckoutResult> {
    const pack = getPack(input.packId);
    return {
      provider: "paystack",
      status: "coming_soon",
      packId: input.packId,
      message: pack ? `${pack.name} is ${pack.priceLabel}, paid once.` : "Choose a pack.",
    };
  },
};
