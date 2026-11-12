import { paystackProvider } from "@/lib/payments/paystack";
import { polarProvider } from "@/lib/payments/polar";
import type { PaymentProvider, PaymentProviderId } from "@/lib/payments/types";

export function paymentProviderId(): PaymentProviderId {
  const value = (process.env.PAYMENT_PROVIDER ?? "polar").trim().toLowerCase();
  return value === "paystack" ? "paystack" : "polar";
}

export function getPaymentProvider(): PaymentProvider {
  return paymentProviderId() === "paystack" ? paystackProvider : polarProvider;
}
