import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AccountsNotice } from "@/components/accounts-notice";
import { logout } from "@/lib/auth/actions";
import { currentAccount } from "@/lib/auth/session";
import { readCreditBalance } from "@/lib/credits";
import { accountsConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your account email and preview credit balance.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-2xl px-4 py-8 text-sm text-ink-soft">Loading dashboard…</p>}>
      <DashboardBody />
    </Suspense>
  );
}

async function DashboardBody() {
  if (!accountsConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-copper uppercase">Account</p>
        <h1 className="mt-3 font-display text-4xl">Dashboard</h1>
        <div className="mt-6">
          <AccountsNotice detail="The tailor still works without an account. Nothing here is locked." />
        </div>
      </div>
    );
  }

  const account = await currentAccount();
  if (!account) redirect("/login?next=/dashboard");
  const credits = await readCreditBalance();
  const email = await profileEmail(account.id, account.email);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-xs font-semibold tracking-[0.16em] text-copper uppercase">Account</p>
      <h1 className="mt-3 font-display text-4xl">Dashboard</h1>
      <section className="mt-6 rounded-3xl border border-line bg-card p-4">
        <h2 className="font-display text-2xl">Email</h2>
        <p className="mt-2 text-base break-all">{email ?? "No email on this account"}</p>
      </section>
      <section className="mt-4 rounded-3xl border border-line bg-card p-4">
        <h2 className="font-display text-2xl">Credits</h2>
        <p className="mt-2 font-display text-5xl">{credits.remaining}</p>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Placeholder balance on this browser, tied to your account id. Checkout is not live, so this is
          not a purchase and nothing renews.
        </p>
      </section>
      <form action={logout} className="mt-6">
        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-ink bg-card px-5 text-base font-semibold"
        >
          Log out
        </button>
      </form>
    </div>
  );
}

async function profileEmail(userId: string, fallback: string | null): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fallback;
  const { data, error } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
  if (error || !data || typeof data.email !== "string") return fallback;
  return data.email;
}
