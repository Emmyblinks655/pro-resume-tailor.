import { currentAccount } from "@/lib/auth/session";
import { getPack } from "@/lib/packs";
import { startPaystackCheckout } from "@/lib/payments/paystack";
import { checkoutFallbackPath, paystackReady } from "@/lib/payments/paystack-config";
import { creditsStoreConfigured } from "@/lib/supabase/admin";
import { accountsConfigured } from "@/lib/supabase/env";

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

  const account = accountsConfigured() ? await currentAccount() : null;
  if (!account) {
    return Response.json({ url: checkoutFallbackPath(false) });
  }
  if (!account.email || !paystackReady() || !creditsStoreConfigured()) {
    return Response.json({ url: checkoutFallbackPath(true) });
  }

  try {
    const url = await startPaystackCheckout({
      packId,
      userId: account.id,
      email: account.email,
    });
    return Response.json({ url });
  } catch (error) {
    console.error("Checkout failed.", error);
    return Response.json({ error: "Checkout could not start. Please try again." }, { status: 502 });
  }
}
