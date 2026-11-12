import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { AccountsNotice } from "@/components/accounts-notice";
import { TailorStudio } from "@/components/tailor-studio";
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
  if (!accountsConfigured()) {
    return (
      <>
        <div className="mx-auto max-w-5xl px-4 pt-6">
          <AccountsNotice detail="You can still tailor a resume. Sign-in turns on after the Supabase keys are set." />
        </div>
        <TailorStudio />
      </>
    );
  }
  const account = await currentAccount();
  if (!account) redirect("/login?next=/tailor");
  return <TailorStudio />;
}
