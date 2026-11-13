import { confirmPaystackPayment } from "@/lib/payments/confirm";
import { paystackSecret } from "@/lib/payments/paystack-config";
import { paystackSignatureMatches } from "@/lib/payments/signature";

/** Paystack server notification: POST /api/webhooks/paystack */
export async function POST(request: Request) {
  const secret = paystackSecret();
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!secret || !paystackSignatureMatches(raw, secret, signature)) {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: unknown;
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  const record = event && typeof event === "object" ? (event as { event?: unknown; data?: unknown }) : {};
  if (record.event !== "charge.success") {
    return Response.json({ received: true });
  }
  const data = record.data && typeof record.data === "object" ? (record.data as { reference?: unknown }) : {};
  const reference = typeof data.reference === "string" ? data.reference : "";
  try {
    await confirmPaystackPayment(reference);
  } catch (error) {
    console.error("Paystack webhook failed.", error);
    return Response.json({ error: "Could not confirm the payment." }, { status: 500 });
  }
  return Response.json({ received: true });
}
