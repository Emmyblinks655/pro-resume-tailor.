import { connection } from "next/server";

import { confirmPaystackPayment } from "@/lib/payments/confirm";
import { paymentRedirectPath } from "@/lib/payments/paystack-config";

/** Browser return path: GET /api/paystack/callback */
export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") || url.searchParams.get("trxref") || "";
  let status: "success" | "failed" = "failed";
  try {
    status = await confirmPaystackPayment(reference);
  } catch (error) {
    console.error("Paystack callback failed.", error);
    status = "failed";
  }
  return new Response(null, {
    status: 303,
    headers: { Location: paymentRedirectPath(status) },
  });
}
