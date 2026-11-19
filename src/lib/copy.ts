import { PACK_PRICE_LABEL } from "@/lib/packs";
import { SUPPORT_EMAIL } from "@/lib/support";

export const TAGLINE =
  `Pro Resume Tailor turns the CV you already have into a role-specific resume for developers and freelancers. Paste the job, download an ATS-safe PDF. Five tailorings for ${PACK_PRICE_LABEL}, once.`;

export const FAQ = [
  {
    question: "Will it invent experience I do not have?",
    answer:
      "No. It only rephrases, reorders, and emphasises what you already wrote. If the job asks for a tool or a metric that is not in your resume, that detail stays out.",
  },
  {
    question: "Is this a subscription?",
    answer:
      `No. Five tailorings cost ${PACK_PRICE_LABEL}, paid once. When those credits are used, nothing renews and nothing else is charged.`,
  },
  {
    question: "Is there a free trial that turns into a subscription?",
    answer:
      `No. There is no trial, no plan, and no automatic renewal. You buy five tailorings for ${PACK_PRICE_LABEL}, once.`,
  },
  {
    question: "What if a payment does not go through?",
    answer: `Email ${SUPPORT_EMAIL} and include your payment reference. We will fix it fast.`,
  },
  {
    question: "What does the download look like?",
    answer:
      "A text-based PDF in a single column. No tables, no images, no text boxes. Choose US Letter or A4. Applicant tracking systems can read the text.",
  },
  {
    question: "Who is it for?",
    answer:
      "Developers and freelancers applying in the United States, the United Kingdom, Canada, Germany, and other markets. The resume stays in your words.",
  },
  {
    question: "Do I need an account?",
    answer:
      "Create an account with your email and a password of at least 8 characters. A 6-digit code confirms the address. Your password is stored as a hash. This app does not keep the password.",
  },
  {
    question: "Do you store my resume?",
    answer:
      "The text is used to produce the draft for that request and is not saved in a database. See the privacy page for how accounts and tailorings are handled.",
  },
] as const;
