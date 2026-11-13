import { paystackProvider } from "@/lib/payments/paystack";
import { polarProvider } from "@/lib/payments/polar";
import type { PaymentProvider, PaymentProviderId } from "@/lib/payments/types";

export function paymentProviderId(): PaymentProviderId {
  const value = (process.env.PAYMENT_PROVIDER ?? "paystack").trim().toLowerCase();
  return value === "polar" ? "polar" : "paystack";
}

export function getPaymentProvider(): PaymentProvider {
  return paymentProviderId() === "polar" ? polarProvider : paystackProvider;
}
