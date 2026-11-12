"use server";

import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/auth/paths";
import { tidyText, validateProfile, withOnboarding, type ProfileFieldErrors } from "@/lib/auth/profile";
import { currentAccount } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OnboardingState = {
  error: string | null;
  fieldErrors: ProfileFieldErrors;
};

export async function saveOnboarding(_previous: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const fullName = tidyText(String(formData.get("fullName") ?? ""));
  const headline = tidyText(String(formData.get("headline") ?? ""));
  const nextPath = safeNextPath(typeof formData.get("next") === "string" ? String(formData.get("next")) : null);
  const fieldErrors = validateProfile(fullName, headline);
  if (Object.keys(fieldErrors).length > 0) return { error: "Check the fields below.", fieldErrors };

  const account = await currentAccount();
  const supabase = await createSupabaseServerClient();
  if (!account || !supabase) return { error: "Log in again to save your name.", fieldErrors: {} };

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, headline: headline || null })
    .eq("id", account.id)
    .select("id");

  if (error || !Array.isArray(data) || data.length === 0) {
    return {
      error: "We couldn't save your name. Apply the latest profiles migration if this keeps happening.",
      fieldErrors: {},
    };
  }
  redirect(withOnboarding(nextPath, false));
}
