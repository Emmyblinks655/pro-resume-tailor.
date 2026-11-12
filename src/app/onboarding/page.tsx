import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AccountsNotice } from "@/components/accounts-notice";
import { AuthCard } from "@/components/auth-card";
import { OnboardingForm } from "@/components/onboarding-form";
import { safeNextPath } from "@/lib/auth/paths";
import { withOnboarding } from "@/lib/auth/profile";
import { readOwnProfile } from "@/lib/auth/profile-server";
import { currentAccount } from "@/lib/auth/session";
import { accountsConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Your name",
  description: "Add your name and an optional role so the dashboard knows who you are.",
};

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md px-4 py-8 text-sm text-ink-soft">Loading…</p>}>
      <OnboardingPanel searchParams={searchParams} />
    </Suspense>
  );
}

async function OnboardingPanel({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(typeof params.next === "string" ? params.next : null);

  if (!accountsConfigured()) {
    return (
      <AuthCard kicker="Account" title="What should we call you?">
        <div className="mt-6">
          <AccountsNotice detail="Add the Supabase URL and publishable anon key on the server, then restart." />
        </div>
      </AuthCard>
    );
  }

  const account = await currentAccount();
  if (!account) redirect(`/login?next=${encodeURIComponent(withOnboarding(nextPath, true))}`);
  const profile = await readOwnProfile(account.id, account.email);

  return (
    <AuthCard
      kicker="Account"
      title="What should we call you?"
      lede="Your name shows on the dashboard. A role is optional, and you can change both later."
    >
      <OnboardingForm
        nextPath={nextPath}
        fullName={profile.fullName ?? ""}
        headline={profile.headline ?? ""}
      />
    </AuthCard>
  );
}
