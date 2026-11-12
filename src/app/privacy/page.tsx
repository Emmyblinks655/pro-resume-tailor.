import type { Metadata } from "next";

import { Legal } from "@/components/legal";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <Legal title="Privacy" kicker="Draft policy">
      <p>
        This is a placeholder for the privacy notice. It describes how this preview works today. Replace
        it before you take real payments or store accounts.
      </p>
      <p>
        Resume text and job descriptions are sent to this app so it can return a draft. This version does
        not save them in a database. Preview credits are kept in an httpOnly cookie on your browser.
      </p>
      <p>
        If a Gemini API key is set on the free tier, Google terms may allow prompts and responses to be
        used to improve their products. A paid Gemini tier is the path if prompts must be excluded.
        Anthropic is unused unless AI_PROVIDER is anthropic and ANTHROPIC_API_KEY is set.
      </p>
      <p>Checkout is not live. This preview does not collect card numbers.</p>
      <p>
        If accounts are turned on, email and password sign-in is handled by Supabase Auth. Supabase stores
        the password hash. The session lives in an httpOnly cookie. A profiles row stores the account id,
        email, and, after onboarding, your name and an optional role. You can read only your own row, and
        you can update only your name and role.
      </p>
    </Legal>
  );
}
