import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { TailorStudio } from "@/components/tailor-studio";
import { withOnboarding } from "@/lib/auth/profile";
import { readOwnProfile } from "@/lib/auth/profile-server";
import { currentAccount } from "@/lib/auth/session";
import { accountsConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Tailor a resume",
  description: "Paste a resume and a job description, then download an ATS-safe PDF.",
};

export default function TailorPage() {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-sm text-ink-soft">Loading the tailor…</p>}>
      <TailorGate />
    </Suspense>
  );
}

async function TailorGate() {
  await connection();
  if (accountsConfigured()) {
    const account = await currentAccount();
    if (!account) redirect("/login?next=/tailor");
    const profile = await readOwnProfile(account.id, account.email);
    if (profile.status === "needs-onboarding") redirect(withOnboarding("/tailor", true));
  }
  return <TailorStudio />;
}
