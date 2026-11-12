import type { FieldErrors } from "@/lib/auth/validation";

export type AuthFormState = {
  error: string | null;
  message: string | null;
  fieldErrors: FieldErrors;
};

export const emptyAuthState: AuthFormState = {
  error: null,
  message: null,
  fieldErrors: {},
};
