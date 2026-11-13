import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth-card";
import { VerifyForm } from "@/components/verify-form";
import { redirectForAccount } from "@/lib/auth/destination";
import { readOtpType } from "@/lib/auth/otp";
import { safeNextPath } from "@/lib/auth/paths";
import { readEmail } from "@/lib/auth/validation";

export const metadata: Metadata = {
  title: "Confirm your email",
  description: "Enter the 6-digit code from your email to finish creating your account.",
};

type VerifySearch = {
  email?: string | string[];
  next?: string | string[];
  sent?: string | string[];
  type?: string | string[];
  notice?: string | string[];
};

function first(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

function statusNote(email: string, sent: boolean, notice: string | null): string | null {
  if (notice === "limited") return "A code was already sent. Wait a minute, then use Resend code.";
  if (notice === "failed") return "We couldn't send a new code just now. Use Resend code to try again.";
  if (sent && email) return `We sent a 6-digit code to ${email}.`;
  if (email) return `Enter the 6-digit code sent to ${email}.`;
  return "Enter the email you signed up with, then the 6-digit code.";
}

export default function VerifyPage({ searchParams }: PageProps<"/verify">) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md px-4 py-8 text-sm text-ink-soft">Loading verification…</p>}>
      <VerifyPanel searchParams={searchParams} />
    </Suspense>
  );
}

async function VerifyPanel({ searchParams }: { searchParams: Promise<VerifySearch> }) {
  const params = await searchParams;
  const nextPath = safeNextPath(first(params.next));
  const email = readEmail(first(params.email));
  const sent = first(params.sent) === "1";
  const noticeValue = first(params.notice);
  const notice = noticeValue === "limited" || noticeValue === "failed" ? noticeValue : null;
  const otpType = readOtpType(first(params.type));

  await redirectForAccount(nextPath);

  return (
    <AuthCard
      kicker="Account"
      title="Enter your code"
      lede="Type the 6-digit code from your email. It confirms the address before you continue."
    >
      <VerifyForm
        initialEmail={email}
        nextPath={nextPath}
        otpType={otpType}
        justSent={sent}
        statusNote={statusNote(email, sent, notice)}
      />
      <p className="mt-4 text-sm leading-6 text-ink-soft">
        Already confirmed?{" "}
        <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-ink underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
