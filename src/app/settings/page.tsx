import type { Metadata } from "next";
import { Suspense } from "react";

import { LinkedInSettings } from "@/components/linkedin-settings";

export const metadata: Metadata = {
  title: "Settings",
  description: "See whether LinkedIn is connected, and disconnect it.",
};

export default function SettingsPage({ searchParams }: PageProps<"/settings">) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-xs font-semibold tracking-[0.16em] text-copper uppercase">Account</p>
      <h1 className="mt-3 font-display text-4xl">Settings</h1>
      <p className="mt-4 text-base leading-7 text-ink-soft">
        LinkedIn sign-in is optional. It identifies the account on this browser and shows the name, email,
        and photo LinkedIn returns.
      </p>
      <Suspense fallback={<p className="mt-6 text-sm text-ink-soft">Loading LinkedIn status…</p>}>
        <LinkedInSettings searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
