export type PaymentProviderId = "polar" | "paystack";

export type CheckoutRequest = {
  packId: string;
};

export type CheckoutResult = {
  provider: PaymentProviderId;
  status: "coming_soon";
  packId: string;
  message: string;
};

export interface PaymentProvider {
  id: PaymentProviderId;
  label: string;
  /** Stub: returns coming_soon. A live adapter will create a hosted checkout here. */
  createCheckout(input: CheckoutRequest): Promise<CheckoutResult>;
}
