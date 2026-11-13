"use client";

import { useActionState } from "react";

import { alertClass, primaryButtonClass, textFieldClass } from "@/components/field-styles";
import { emptyAuthState, type AuthFormState } from "@/lib/auth/form-state";
import { PASSWORD_MIN } from "@/lib/auth/validation";

export function AuthForm({
  mode,
  nextPath,
  action,
  queryError,
}: {
  mode: "login" | "signup";
  nextPath: string;
  action: (previous: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  queryError: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, emptyAuthState);
  const emailError = state.fieldErrors.email;
  const passwordError = state.fieldErrors.password;
  const confirmError = state.fieldErrors.confirm;

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="next" value={nextPath} />
      {queryError ? (
        <p role="alert" className={alertClass}>
          {queryError}
        </p>
      ) : null}
      {state.error ? (
        <p role="alert" className={alertClass}>
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p role="status" className={alertClass}>
          {state.message}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="text-sm font-semibold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
          className={textFieldClass}
        />
        {emailError ? (
          <p id="email-error" className="mt-1 text-sm text-danger">
            {emailError}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-semibold">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={PASSWORD_MIN}
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? "password-error" : "password-hint"}
          className={textFieldClass}
        />
        <p id="password-hint" className="mt-1 text-sm text-ink-soft">
          At least {PASSWORD_MIN} characters.
        </p>
        {passwordError ? (
          <p id="password-error" className="mt-1 text-sm text-danger">
            {passwordError}
          </p>
        ) : null}
      </div>

      {mode === "signup" ? (
        <div>
          <label htmlFor="confirm" className="text-sm font-semibold">
            Confirm password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN}
            aria-invalid={confirmError ? true : undefined}
            aria-describedby={confirmError ? "confirm-error" : undefined}
            className={textFieldClass}
          />
          {confirmError ? (
            <p id="confirm-error" className="mt-1 text-sm text-danger">
              {confirmError}
            </p>
          ) : null}
        </div>
      ) : null}

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Working…" : mode === "signup" ? "Create account" : "Log in"}
      </button>
    </form>
  );
}
