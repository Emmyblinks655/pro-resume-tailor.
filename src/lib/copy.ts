export const TAGLINE =
  "Pro Resume Tailor helps job seekers turn a generic CV into a role-specific resume in seconds. Upload your CV, paste the job description, and get a tailored version that highlights the right skills. Five tailorings for nine dollars.";

export const FAQ = [
  {
    question: "Will it invent experience I do not have?",
    answer:
      "No. It only rephrases, reorders, and emphasises what you already wrote. If the job asks for a tool or a metric that is not in your resume, that detail stays out.",
  },
  {
    question: "Is this a subscription?",
    answer:
      "No. Five tailorings cost nine dollars, paid once. When those credits are used, nothing renews and nothing else is charged.",
  },
  {
    question: "Is there a free trial that turns into a subscription?",
    answer:
      "No. There is no trial, no plan, and no automatic renewal. Checkout is not live in this preview, and the buttons say so.",
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
      "When Supabase is configured, you sign up with an email and a password of at least 8 characters. A 6-digit code confirms the address. Until those keys are set, the login page says accounts are not configured yet and the tailor stays open. Passwords are hashed by Supabase. This app does not keep them.",
  },
  {
    question: "Do you store my resume?",
    answer:
      "Not in a database in this version. The text is used to produce the draft for that request. Preview credits live in a cookie on your browser. See the privacy page for the draft policy.",
  },
] as const;
