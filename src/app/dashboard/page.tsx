import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { AccountsNotice } from "@/components/accounts-notice";
import { primaryButtonClass, quietButtonClass } from "@/components/field-styles";
import { logout } from "@/lib/auth/actions";
import { currentAccount } from "@/lib/auth/session";
import { withOnboarding } from "@/lib/auth/profile";
import { readOwnProfile } from "@/lib/auth/profile-server";
import { readCreditBalance } from "@/lib/credits";
import { accountsConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your name, preview credit balance, and a shortcut to tailor a resume.",
};

const cardClass =
  "rounded-[28px] border border-line bg-card p-6 shadow-[0_16px_40px_rgba(28,25,21,0.05)]";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-lg px-4 py-8 text-sm text-ink-soft">Loading dashboard…</p>}>
      <DashboardBody />
    </Suspense>
  );
}

async function DashboardBody() {
  await connection();
  if (!accountsConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
        <p className="text-xs font-semibold tracking-[0.16em] text-copper uppercase">Account</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">Dashboard</h1>
        <div className="mt-6">
          <AccountsNotice detail="The tailor still works without an account. Nothing here is locked." />
        </div>
      </div>
    );
  }

  const account = await currentAccount();
  if (!account) redirect("/login?next=/dashboard");
  const [credits, profile] = await Promise.all([
    readCreditBalance(),
    readOwnProfile(account.id, account.email),
  ]);
  if (profile.status === "needs-onboarding") redirect(withOnboarding("/dashboard", true));

  const email = profile.email ?? account.email;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-8 sm:py-12">
      <section className={cardClass}>
        <p className="text-xs font-semibold tracking-[0.16em] text-copper uppercase">Dashboard</p>
        <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight">
          {profile.fullName ? `Hello, ${profile.fullName}` : "Hello"}
        </h1>
        {profile.headline ? <p className="mt-2 text-lg text-ink">{profile.headline}</p> : null}
        <p className="mt-3 text-sm leading-6 break-all text-ink-soft">{email ?? "No email on this account"}</p>
      </section>

      <section className={cardClass}>
        <h2 className="text-xs font-semibold tracking-[0.16em] text-copper uppercase">Credits</h2>
        <p className="mt-3 font-display text-6xl leading-none tabular-nums">{credits.remaining}</p>
        <p className="mt-3 text-sm leading-6 text-ink-soft">{credits.note}</p>
      </section>

      <Link href="/tailor" className={primaryButtonClass}>
        Tailor a resume
      </Link>
      <form action={logout}>
        <button type="submit" className={quietButtonClass}>
          Log out
        </button>
      </form>
    </div>
  );
}
