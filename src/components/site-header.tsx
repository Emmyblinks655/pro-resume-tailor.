import { Suspense } from "react";

import { SiteHeaderBar } from "@/components/site-header-bar";
import { currentAccount } from "@/lib/auth/session";
import { accountsConfigured } from "@/lib/supabase/env";

export function SiteHeader() {
  return (
    <Suspense fallback={<SiteHeaderBar account={null} pending />}>
      <SignedInHeader />
    </Suspense>
  );
}

async function SignedInHeader() {
  const account = accountsConfigured() ? await currentAccount() : null;
  return <SiteHeaderBar account={account} />;
}
