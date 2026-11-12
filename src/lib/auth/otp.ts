import { safeNextPath } from "@/lib/auth/paths";

export const OTP_LENGTH = 6;
export const RESEND_COOLDOWN_SECONDS = 60;

export type OtpType = "signup" | "email";

export function normalizeOtp(value: string): string {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

export function readOtpType(value: string | null | undefined): OtpType {
  return value === "email" ? "email" : "signup";
}

export function applyOtpDigits(current: readonly string[], startIndex: number, raw: string): string[] {
  const next = current.slice(0, OTP_LENGTH);
  while (next.length < OTP_LENGTH) next.push("");
  const index = Math.min(Math.max(startIndex, 0), OTP_LENGTH - 1);
  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    next[index] = "";
    return next;
  }
  for (let offset = 0; offset < digits.length && index + offset < OTP_LENGTH; offset += 1) {
    next[index + offset] = digits[offset] ?? "";
  }
  return next;
}

export function otpCaret(startIndex: number, raw: string): number {
  const index = Math.min(Math.max(startIndex, 0), OTP_LENGTH - 1);
  const count = raw.replace(/\D/g, "").length;
  if (count <= 0) return index;
  return Math.min(OTP_LENGTH - 1, index + count);
}

export function verifyPath(
  email: string,
  nextPath: string,
  options?: { sent?: boolean; notice?: "limited" | "failed"; type?: OtpType },
): string {
  const params = new URLSearchParams();
  const trimmed = email.trim();
  if (trimmed) params.set("email", trimmed);
  params.set("next", safeNextPath(nextPath));
  if (options?.sent) params.set("sent", "1");
  if (options?.notice) params.set("notice", options.notice);
  if (options?.type === "email") params.set("type", "email");
  return `/verify?${params.toString()}`;
}

export function resendNotice(error: { message?: string; code?: string } | null): "sent" | "limited" | "failed" {
  if (!error) return "sent";
  const text = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  if (/rate|only request|once every|too many|security purposes/.test(text)) return "limited";
  return "failed";
}

export function shouldTryNextOtpType(error: { message?: string; code?: string }): boolean {
  const code = (error.code ?? "").toLowerCase();
  if (code === "otp_expired" || code === "otp_disabled") return true;
  const message = (error.message ?? "").toLowerCase();
  if (/rate|too many|only request/.test(message)) return false;
  return /token has expired|otp|invalid/.test(message);
}
