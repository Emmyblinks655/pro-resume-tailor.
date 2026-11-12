import type { Metadata } from "next";

import { Legal } from "@/components/legal";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <Legal title="Terms" kicker="Draft terms">
      <p>
        This is a placeholder. It is not a finished customer agreement. Have it reviewed before launch.
      </p>
      <p>
        Pro Resume Tailor is a drafting aid. You are responsible for the resume you submit. The product
        does not promise interviews, offers, or that a parser will score you a particular way.
      </p>
      <p>
        The paid product is a one-time pack of credits. It is not a subscription. There is no trial that
        converts into a recurring charge. Checkout is not connected in this version, so these terms do
        not yet cover a live sale.
      </p>
      <p>
        Do not upload a resume you are not allowed to process. The tailor is instructed to rephrase,
        reorder, and emphasise only what you supplied.
      </p>
    </Legal>
  );
}
