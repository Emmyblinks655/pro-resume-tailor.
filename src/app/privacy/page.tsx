import type { Metadata } from "next";

import { Legal } from "@/components/legal";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Pro Resume Tailor handles resume text, accounts, and payments.",
};

export default function PrivacyPage() {
  return (
    <Legal title="Privacy" kicker="Privacy">
      <p>
        Resume text and job descriptions are sent to Pro Resume Tailor so it can return a draft for that
        request. That text is not saved in a database.
      </p>
      <p>
        A language model may process the text you submit in order to write the draft. The draft is checked
        against your original resume so employers, dates, metrics, and tools you did not supply are not
        added.
      </p>
      <p>
        Tailorings remaining are kept for this browser. This app does not collect or store card numbers. A
        purchase is a one-time pack.
      </p>
      <p>
        If you create an account, you sign in with an email and a password. The password is stored only as
        a hash by the authentication provider. Your profile stores your account id, email, name, and an
        optional role. You can read only your own profile, and you can update your name and role.
      </p>
      <p>You can log out at any time. Logging out ends the session stored in an httpOnly cookie.</p>
    </Legal>
  );
}
