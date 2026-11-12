import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AccountsNotice } from "@/components/accounts-notice";
import { AuthCard } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";
import { signup } from "@/lib/auth/actions";
import { redirectForAccount } from "@/lib/auth/destination";
import { safeNextPath } from "@/lib/auth/paths";
import { accountsConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create an account with your email and a password.",
};

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md px-4 py-8 text-sm text-ink-soft">Loading signup…</p>}>
      <SignupPanel searchParams={searchParams} />
    </Suspense>
  );
}

async function SignupPanel({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(typeof params.next === "string" ? params.next : null);

  if (!accountsConfigured()) {
    return (
      <AuthCard kicker="Account" title="Sign up">
        <div className="mt-6">
          <AccountsNotice detail="Add the Supabase URL and publishable anon key on the server, then restart." />
        </div>
      </AuthCard>
    );
  }

  await redirectForAccount(nextPath);

  return (
    <AuthCard
      kicker="Account"
      title="Sign up"
      lede="Email and a password of at least 8 characters. We'll email a 6-digit code to confirm the address. Supabase stores the password hash. This app never keeps the password."
    >
      <AuthForm mode="signup" nextPath={nextPath} action={signup} queryError={null} />
      <p className="mt-4 text-sm leading-6 text-ink-soft">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-ink underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
