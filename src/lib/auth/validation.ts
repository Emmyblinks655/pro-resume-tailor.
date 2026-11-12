export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export type FieldErrors = {
  email?: string;
  password?: string;
  confirm?: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readEmail(value: string | null | undefined): string {
  const email = (value ?? "").trim();
  if (!email || email.length > 254 || !EMAIL.test(email)) return "";
  return email;
}

export function validateCredentials(
  email: string,
  password: string,
  confirm?: string,
): FieldErrors {
  const fieldErrors: FieldErrors = {};
  if (!email) fieldErrors.email = "Enter your email address.";
  else if (email.length > 254 || !EMAIL.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (!password) fieldErrors.password = "Enter a password.";
  else if (password.length < PASSWORD_MIN) {
    fieldErrors.password = `Use at least ${PASSWORD_MIN} characters.`;
  } else if (password.length > PASSWORD_MAX) {
    fieldErrors.password = `Use at most ${PASSWORD_MAX} characters.`;
  }
  if (confirm !== undefined && password !== confirm) {
    fieldErrors.confirm = "Those passwords do not match.";
  }
  return fieldErrors;
}

export const CONFIRM_EMAIL_MESSAGE = "Check your email for a 6-digit code.";

export function friendlyOtpError(message: string): string {
  const text = message.toLowerCase();
  if (/rate|too many|only request|once every|security purposes/.test(text)) {
    return "Wait a minute, then request a new code.";
  }
  if (/expired|invalid|otp|token/.test(text)) {
    return "That code is invalid or expired. Request a new one.";
  }
  if (text.length > 0 && text.length <= 180 && !message.includes("<")) return message.trim();
  return "The code could not be checked. Try again.";
}

export function friendlyResendError(message: string): string {
  const text = message.toLowerCase();
  if (/rate|too many|only request|once every|security purposes/.test(text)) {
    return "A code was just sent. Wait a minute before requesting another.";
  }
  if (/already confirmed|already registered|email address already/.test(text)) {
    return "That email is already confirmed. Log in.";
  }
  if (text.length > 0 && text.length <= 180 && !message.includes("<")) return message.trim();
  return "We couldn't send a new code. Try again in a minute.";
}

export function isEmailUnconfirmed(error: { message?: string; code?: string }): boolean {
  const code = (error.code ?? "").toLowerCase();
  const message = (error.message ?? "").toLowerCase();
  return code === "email_not_confirmed" || /not confirmed/.test(message);
}

export function friendlyAuthError(message: string): string {
  const text = message.trim();
  if (/invalid login credentials/i.test(text)) return "That email and password did not match.";
  if (isEmailUnconfirmed({ message: text })) return CONFIRM_EMAIL_MESSAGE;
  if (/already registered|already been registered|user already exists/i.test(text)) {
    return "An account with that email already exists. Log in instead.";
  }
  if (/password/i.test(text) && /at least|should be|too short|weak/i.test(text)) {
    return `Use at least ${PASSWORD_MIN} characters.`;
  }
  if (text.length > 0 && text.length <= 180 && !text.includes("<")) return text;
  return "The account request did not go through. Try again.";
}
