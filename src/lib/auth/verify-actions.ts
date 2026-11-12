"use server";

import { redirect } from "next/navigation";

import { callbackUrl, requestOrigin } from "@/lib/auth/origin";
import { normalizeOtp, readOtpType, shouldTryNextOtpType, type OtpType } from "@/lib/auth/otp";
import { safeNextPath } from "@/lib/auth/paths";
import { fullNameFromRow, needsOnboarding, withOnboarding } from "@/lib/auth/profile";
import { friendlyOtpError, friendlyResendError, readEmail } from "@/lib/auth/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type VerifyFormState = { error: string | null };
export type ResendFormState = { error: string | null; message: string | null };

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

export async function verifyEmailCode(_previous: VerifyFormState, formData: FormData): Promise<VerifyFormState> {
  const email = readEmail(String(formData.get("email") ?? ""));
  const token = normalizeOtp(String(formData.get("token") ?? ""));
  const nextPath = readNext(formData);
  const preferred = readOtpType(String(formData.get("otpType") ?? ""));
  if (!email) return { error: "Enter the email address the code was sent to." };
  if (token.length !== 6) return { error: "Enter all 6 digits." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Accounts aren't configured yet." };

  const types: OtpType[] = preferred === "email" ? ["email", "signup"] : ["signup", "email"];
  let lastMessage = "The code could not be checked. Try again.";
  for (let index = 0; index < types.length; index += 1) {
    const type = types[index];
    if (!type) break;
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type });
    if (!error) {
      const userId = data.user?.id ?? data.session?.user?.id;
      redirect(userId ? await destinationForUser(supabase, userId, nextPath) : nextPath);
    }
    lastMessage = error.message;
    const another = types[index + 1];
    if (!another || !shouldTryNextOtpType(error)) break;
  }
  return { error: friendlyOtpError(lastMessage) };
}

export async function resendSignupCode(_previous: ResendFormState, formData: FormData): Promise<ResendFormState> {
  const email = readEmail(String(formData.get("email") ?? ""));
  const nextPath = readNext(formData);
  if (!email) return { error: "Enter the email you used to sign up.", message: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Accounts aren't configured yet.", message: null };

  const origin = await requestOrigin();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: callbackUrl(origin, nextPath) },
  });
  if (error) return { error: friendlyResendError(error.message), message: null };
  return { error: null, message: "A new code is on its way." };
}
