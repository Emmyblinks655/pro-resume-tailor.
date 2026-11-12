import Link from "next/link";

import { logout } from "@/lib/auth/actions";
import { currentAccount } from "@/lib/auth/session";
import { accountsConfigured } from "@/lib/supabase/env";

export async function AuthNav() {
  const account = accountsConfigured() ? await currentAccount() : null;

  if (account) {
    return (
      <>
        <Link href="/dashboard" className="inline-flex min-h-11 shrink-0 items-center underline-offset-4 hover:underline">
          Dashboard
        </Link>
        <form action={logout}>
          <button type="submit" className="inline-flex min-h-11 shrink-0 items-center underline-offset-4 hover:underline">
            Log out
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <Link href="/login" className="inline-flex min-h-11 shrink-0 items-center underline-offset-4 hover:underline">
        Log in
      </Link>
      <Link href="/signup" className="inline-flex min-h-11 shrink-0 items-center underline-offset-4 hover:underline">
        Sign up
      </Link>
    </>
  );
}
