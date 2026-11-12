import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AccountsNotice } from "@/components/accounts-notice";
import { AuthForm } from "@/components/auth-form";
import { login } from "@/lib/auth/actions";
import { safeNextPath } from "@/lib/auth/paths";
import { currentAccount } from "@/lib/auth/session";
import { accountsConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in with your email and password.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md px-4 py-8 text-sm text-ink-soft">Loading login…</p>}>
      <LoginPanel searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginPanel({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; error?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(typeof params.next === "string" ? params.next : null);
  const queryError =
    params.error === "confirm" ? "That confirmation link did not finish. Request a new one by signing up again, or log in if you already confirmed." : null;

  if (!accountsConfigured()) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-copper uppercase">Account</p>
        <h1 className="mt-3 font-display text-4xl">Log in</h1>
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
      <h1 className="mt-3 font-display text-4xl">Log in</h1>
      <p className="mt-3 text-base leading-7 text-ink-soft">
        Use the email and password for your Pro Resume Tailor account.
      </p>
      <AuthForm mode="login" nextPath={nextPath} action={login} queryError={queryError} />
      <p className="mt-4 text-sm leading-6 text-ink-soft">
        No account yet?{" "}
        <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-ink underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
