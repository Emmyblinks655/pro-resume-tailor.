export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export type FieldErrors = {
  email?: string;
  password?: string;
  confirm?: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function friendlyAuthError(message: string): string {
  const text = message.trim();
  if (/invalid login credentials/i.test(text)) return "That email and password did not match.";
  if (/email not confirmed/i.test(text)) return "Confirm your email before logging in. Check your inbox for the link.";
  if (/already registered|already been registered|user already exists/i.test(text)) {
    return "An account with that email already exists. Log in instead.";
  }
  if (/password/i.test(text) && /at least|should be|too short|weak/i.test(text)) {
    return `Use at least ${PASSWORD_MIN} characters.`;
  }
  if (text.length > 0 && text.length <= 180 && !text.includes("<")) return text;
  return "The account request did not go through. Try again.";
}
