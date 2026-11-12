import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AccountsNotice } from "@/components/accounts-notice";
import { AuthForm } from "@/components/auth-form";
import { signup } from "@/lib/auth/actions";
import { safeNextPath } from "@/lib/auth/paths";
import { currentAccount } from "@/lib/auth/session";
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
      <div className="mx-auto max-w-md px-4 py-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-copper uppercase">Account</p>
        <h1 className="mt-3 font-display text-4xl">Sign up</h1>
        <div className="mt-6">
          <AccountsNotice detail="Add the Supabase URL and publishable anon key on the server, then restart." />
        </div>
      </div>
    );
  }

  const account = await currentAccount();
  if (account) redirect(nextPath);

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <p className="text-xs font-semibold tracking-[0.16em] text-copper uppercase">Account</p>
      <h1 className="mt-3 font-display text-4xl">Sign up</h1>
      <p className="mt-3 text-base leading-7 text-ink-soft">
        Email and a password of at least 8 characters. Supabase stores the password hash. This app never
        keeps the password.
      </p>
      <AuthForm mode="signup" nextPath={nextPath} action={signup} queryError={null} />
      <p className="mt-4 text-sm leading-6 text-ink-soft">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-ink underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
