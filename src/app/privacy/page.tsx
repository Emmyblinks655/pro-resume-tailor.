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
        LinkedIn sign-in is optional. It uses OpenID Connect and receives your name, email, profile photo,
        and LinkedIn member ID. It does not receive work history, endorsements, or network data. The access
        token is encrypted with AES-256-GCM and stored in Supabase, or in an httpOnly cookie when Supabase
        is not configured. Disconnect deletes that data and asks LinkedIn to revoke the token when LinkedIn
        accepts the request.
      </p>
      <p>
        If a Gemini API key is set on the free tier, Google terms may allow prompts and responses to be
        used to improve their products. A paid Gemini tier is the path if prompts must be excluded.
        Anthropic is unused unless AI_PROVIDER is anthropic and ANTHROPIC_API_KEY is set.
      </p>
      <p>Checkout is not live. This preview does not collect card numbers.</p>
    </Legal>
  );
}
