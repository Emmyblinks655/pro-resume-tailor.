import type { Metadata } from "next";

import { Legal } from "@/components/legal";

export const metadata: Metadata = { title: "Refunds" };

export default function RefundPage() {
  return (
    <Legal title="Refunds" kicker="Draft policy">
      <p>
        Payments are not live, so this refund policy is not in effect yet. Nothing in the app can charge
        you today.
      </p>
      <p>
        When one-time packs go on sale, the intended rule is: a pack can be refunded within 14 days if
        none of its tailorings were used. A used credit is the drafting work, and that part of the pack
        is not refunded. There is no subscription to cancel, because there is no subscription.
      </p>
      <p>
        Local preview credits in this version are not a purchase. Clearing the site cookie resets them.
        They cannot be refunded because no money moved.
      </p>
    </Legal>
  );
}
