"use server";

import { redirect } from "next/navigation";

import type { AuthFormState } from "@/lib/auth/form-state";
import { callbackUrl, requestOrigin } from "@/lib/auth/origin";
import { resendNotice, verifyPath } from "@/lib/auth/otp";
import { safeNextPath } from "@/lib/auth/paths";
import { fullNameFromRow, needsOnboarding, withOnboarding } from "@/lib/auth/profile";
import {
  friendlyAuthError,
  isEmailUnconfirmed,
  validateCredentials,
  type FieldErrors,
} from "@/lib/auth/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function failure(error: string, fieldErrors: FieldErrors = {}): AuthFormState {
  return { error, message: null, fieldErrors };
}

function readNext(formData: FormData): string {
  const value = formData.get("next");
  return safeNextPath(typeof value === "string" ? value : null);
}

type ServerSupabase = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

async function destinationForUser(supabase: ServerSupabase, userId: string, nextPath: string): Promise<string> {
  const { data, error } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
  if (error) return safeNextPath(nextPath);
  return withOnboarding(nextPath, needsOnboarding(fullNameFromRow(data)));
}

export async function login(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = readNext(formData);
  const fieldErrors = validateCredentials(email, password);
  if (Object.keys(fieldErrors).length > 0) return failure("Check the fields below.", fieldErrors);

  const supabase = await createSupabaseServerClient();
  if (!supabase) return failure("We couldn't sign you in just now. Please try again.");

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (isEmailUnconfirmed(error)) {
      const origin = await requestOrigin();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: callbackUrl(origin, nextPath) },
      });
      const notice = resendNotice(resendError);
      redirect(verifyPath(email, nextPath, { sent: notice === "sent", notice: notice === "sent" ? undefined : notice }));
    }
    return failure(friendlyAuthError(error.message));
  }

  const userId = data.user?.id;
  redirect(userId ? await destinationForUser(supabase, userId, nextPath) : nextPath);
}

export async function signup(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const nextPath = readNext(formData);
  const fieldErrors = validateCredentials(email, password, confirm);
  if (Object.keys(fieldErrors).length > 0) return failure("Check the fields below.", fieldErrors);

  const supabase = await createSupabaseServerClient();
  if (!supabase) return failure("We couldn't create your account just now. Please try again.");

  const origin = await requestOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl(origin, nextPath),
    },
  });
  if (error) {
    if (isEmailUnconfirmed(error)) redirect(verifyPath(email, nextPath, { sent: true }));
    return failure(friendlyAuthError(error.message));
  }
  if (!data.session) redirect(verifyPath(email, nextPath, { sent: true }));
  const userId = data.user?.id;
  redirect(userId ? await destinationForUser(supabase, userId, nextPath) : nextPath);
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
