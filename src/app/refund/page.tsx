import type { Metadata } from "next";

import { Legal } from "@/components/legal";
import { SupportLink } from "@/components/support-link";

export const metadata: Metadata = {
  title: "Refunds",
  description: "Refunds for an unused pack of resume tailorings.",
};

export default function RefundPage() {
  return (
    <Legal title="Refunds" kicker="Refunds">
      <p>
        A pack can be refunded within 14 days if none of its tailorings were used. A used tailoring is the
        drafting work, and that part of the pack is not refunded.
      </p>
      <p>There is no subscription to cancel.</p>
      <p>
        Tailorings that were not paid for are not refundable, because no payment was made. To ask about a
        paid pack, email <SupportLink /> and include the payment reference from your receipt.
      </p>
    </Legal>
  );
}
