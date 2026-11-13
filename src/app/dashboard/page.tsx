import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { cardClass, primaryButtonClass, quietButtonClass } from "@/components/field-styles";
import { logout } from "@/lib/auth/actions";
import { withOnboarding } from "@/lib/auth/profile";
import { readOwnProfile } from "@/lib/auth/profile-server";
import { currentAccount } from "@/lib/auth/session";
import { readCreditBalance } from "@/lib/credits";
import { accountsConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your name, tailorings left, and a shortcut to tailor a resume.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-3xl px-4 py-8 text-sm text-ink-soft">Loading dashboard…</p>}>
      <DashboardBody />
    </Suspense>
  );
}

async function DashboardBody() {
  await connection();
  if (!accountsConfigured()) {
    const credits = await readCreditBalance();
    return (
      <DashboardFrame
        kicker="Dashboard"
        title="Your tailorings"
        detail="Sign up to keep your name with the resumes you tailor."
        remaining={credits.remaining}
        note={credits.note}
        primaryHref="/tailor"
        primaryLabel="Tailor a resume"
        secondaryHref="/signup?next=/dashboard"
        secondaryLabel="Create an account"
      />
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
    <DashboardFrame
      kicker="Dashboard"
      title={profile.fullName ? `Hello, ${profile.fullName}` : "Hello"}
      detail={profile.headline ?? email ?? "No email on this account"}
      extra={profile.headline ? email : null}
      remaining={credits.remaining}
      note={credits.note}
      primaryHref="/tailor"
      primaryLabel="Tailor a resume"
      logout
    />
  );
}

function DashboardFrame({
  kicker,
  title,
  detail,
  extra,
  remaining,
  note,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  logout: showLogout,
}: {
  kicker: string;
  title: string;
  detail: string | null;
  extra?: string | null;
  remaining: number;
  note: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  logout?: boolean;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-10 sm:py-14">
      <section className={cardClass}>
        <p className="text-xs font-bold tracking-[0.16em] text-accent uppercase">{kicker}</p>
        <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">{title}</h1>
        {detail ? <p className="mt-3 text-lg leading-7 text-ink">{detail}</p> : null}
        {extra ? <p className="mt-2 text-sm leading-6 break-all text-ink-soft">{extra}</p> : null}
      </section>

      <section className="rounded-[28px] border border-white/10 bg-deep p-6 text-[#f6f3ec] shadow-[0_22px_50px_-28px_rgba(18,36,28,0.45)]">
        <h2 className="text-xs font-bold tracking-[0.16em] text-brass uppercase">Tailorings left</h2>
        <p className="mt-3 font-display text-7xl leading-none tabular-nums">{remaining}</p>
        <p className="mt-4 max-w-md text-sm leading-6 text-[#d5e4dc]">{note}</p>
        <Link
          href="/pricing"
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-[#f6f3ec] px-5 text-sm font-semibold text-deep"
        >
          Get 5 tailorings for $9
        </Link>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={primaryHref} className={primaryButtonClass}>
          {primaryLabel}
        </Link>
        <Link href="/jobs" className={quietButtonClass}>
          Browse jobs
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link href={secondaryHref} className={`${quietButtonClass} sm:col-span-2`}>
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
      {showLogout ? (
        <form action={logout}>
          <button type="submit" className={quietButtonClass}>
            Log out
          </button>
        </form>
      ) : null}
    </div>
  );
}
