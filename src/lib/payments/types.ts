export type PaymentProviderId = "polar" | "paystack";

export type CheckoutRequest = {
  packId: string;
  userId?: string;
  email?: string;
};

export type CheckoutResult = {
  provider: PaymentProviderId;
  status: "redirect" | "unavailable";
  packId: string;
  url: string | null;
};

export interface PaymentProvider {
  id: PaymentProviderId;
  label: string;
  createCheckout(input: CheckoutRequest): Promise<CheckoutResult>;
}
