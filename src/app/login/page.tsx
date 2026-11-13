import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";
import { login } from "@/lib/auth/actions";
import { redirectForAccount } from "@/lib/auth/destination";
import { verifyPath } from "@/lib/auth/otp";
import { safeNextPath } from "@/lib/auth/paths";

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
    params.error === "confirm"
      ? "That confirmation link did not finish. Enter the 6-digit code instead, or log in if you already confirmed."
      : null;

  await redirectForAccount(nextPath);

  return (
    <AuthCard
      kicker="Account"
      title="Log in"
      lede="Use the email and password for your Pro Resume Tailor account."
    >
      <AuthForm mode="login" nextPath={nextPath} action={login} queryError={queryError} />
      {queryError ? (
        <p className="mt-4 text-sm leading-6">
          <Link href={verifyPath("", nextPath)} className="font-semibold text-ink underline">
            Enter a code
          </Link>
        </p>
      ) : null}
      <p className="mt-4 text-sm leading-6 text-ink-soft">
        No account yet?{" "}
        <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-ink underline">
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}
