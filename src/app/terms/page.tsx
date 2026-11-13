import type { Metadata } from "next";

import { Legal } from "@/components/legal";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using Pro Resume Tailor and buying a one-time pack of tailorings.",
};

export default function TermsPage() {
  return (
    <Legal title="Terms" kicker="Terms">
      <p>
        Pro Resume Tailor is a drafting aid. You are responsible for the resume you submit. The product
        does not promise interviews, offers, or that a parser will score you a particular way.
      </p>
      <p>
        The paid product is a one-time pack of five tailorings for ₦9,900. It is not a
        subscription. There is no trial that converts into a recurring charge. Nothing renews when the
        tailorings are used.
      </p>
      <p>
        Do not upload a resume you are not allowed to process. The tailor rephrases, reorders, and
        emphasises only what you supplied.
      </p>
    </Legal>
  );
}
