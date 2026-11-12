"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { AuthFormState } from "@/lib/auth/form-state";
import { safeNextPath } from "@/lib/auth/paths";
import { friendlyAuthError, validateCredentials, type FieldErrors } from "@/lib/auth/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function failure(error: string, fieldErrors: FieldErrors = {}): AuthFormState {
  return { error, message: null, fieldErrors };
}

async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host")?.split(",")[0]?.trim() || headerList.get("host");
  const proto = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

function readNext(formData: FormData): string {
  const value = formData.get("next");
  return safeNextPath(typeof value === "string" ? value : null);
}

export async function login(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = readNext(formData);
  const fieldErrors = validateCredentials(email, password);
  if (Object.keys(fieldErrors).length > 0) return failure("Check the fields below.", fieldErrors);

  const supabase = await createSupabaseServerClient();
  if (!supabase) return failure("Accounts aren't configured yet.");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return failure(friendlyAuthError(error.message));
  redirect(nextPath);
}

export async function signup(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const nextPath = readNext(formData);
  const fieldErrors = validateCredentials(email, password, confirm);
  if (Object.keys(fieldErrors).length > 0) return failure("Check the fields below.", fieldErrors);

  const supabase = await createSupabaseServerClient();
  if (!supabase) return failure("Accounts aren't configured yet.");

  const origin = await requestOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  });
  if (error) return failure(friendlyAuthError(error.message));
  if (!data.session) {
    return {
      error: null,
      message: "Check your email for a confirmation link, then log in.",
      fieldErrors: {},
    };
  }
  redirect(nextPath);
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
