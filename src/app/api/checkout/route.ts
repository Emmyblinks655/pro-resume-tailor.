import { getPack } from "@/lib/packs";
import { getPaymentProvider } from "@/lib/payments";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Choose a pack." }, { status: 400 });
  }
  const packId = json && typeof json === "object" ? (json as { packId?: unknown }).packId : undefined;
  if (typeof packId !== "string" || !getPack(packId)) {
    return Response.json({ error: "Unknown pack." }, { status: 400 });
  }
  const provider = getPaymentProvider();
  const result = await provider.createCheckout({ packId });
  return Response.json({ ...result, providerLabel: provider.label });
}
