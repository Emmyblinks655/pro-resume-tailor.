import { redirect } from "next/navigation";

import { readOwnProfile } from "@/lib/auth/profile-server";
import { withOnboarding } from "@/lib/auth/profile";
import { currentAccount } from "@/lib/auth/session";

/** Send a signed-in user to onboarding when their profile has no name. */
export async function redirectForAccount(nextPath: string): Promise<void> {
  const account = await currentAccount();
  if (!account) return;
  const profile = await readOwnProfile(account.id, account.email);
  redirect(withOnboarding(nextPath, profile.status === "needs-onboarding"));
}
