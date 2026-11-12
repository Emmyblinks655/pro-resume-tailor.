import type { Metadata } from "next";
import { Suspense } from "react";

import { LinkedInConsent } from "@/components/linkedin-consent";

export const metadata: Metadata = {
  title: "Connect LinkedIn",
  description: "What Sign In with LinkedIn using OpenID Connect shares, and what it does not.",
};

export default function LinkedInConsentPage({ searchParams }: PageProps<"/settings/linkedin">) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-xs font-semibold tracking-[0.16em] text-copper uppercase">Before redirect</p>
      <h1 className="mt-3 font-display text-4xl leading-tight">Connect LinkedIn</h1>
      <p className="mt-4 text-base leading-7 text-ink-soft">
        Sign In with LinkedIn using OpenID Connect asks for openid, profile, and email. This page is the
        consent step. Nothing is sent to LinkedIn until you continue.
      </p>
      <Suspense fallback={<p className="mt-6 text-sm text-ink-soft">Loading consent…</p>}>
        <LinkedInConsent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
