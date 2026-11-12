"use client";

import { useActionState } from "react";

import { emptyAuthState, type AuthFormState } from "@/lib/auth/form-state";
import { PASSWORD_MIN } from "@/lib/auth/validation";

const inputClass = "mt-1 min-h-12 w-full rounded-2xl border border-line bg-card px-3 text-base";

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
        <p role="alert" className="rounded-2xl bg-highlight px-3 py-2 text-sm leading-6">
          {queryError}
        </p>
      ) : null}
      {state.error ? (
        <p role="alert" className="rounded-2xl bg-highlight px-3 py-2 text-sm leading-6">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p role="status" className="rounded-2xl bg-highlight px-3 py-2 text-sm leading-6">
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
          required
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
          className={inputClass}
        />
        {emailError ? (
          <p id="email-error" className="mt-1 text-sm text-copper">
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
          className={inputClass}
        />
        <p id="password-hint" className="mt-1 text-sm text-ink-soft">
          At least {PASSWORD_MIN} characters.
        </p>
        {passwordError ? (
          <p id="password-error" className="mt-1 text-sm text-copper">
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
            className={inputClass}
          />
          {confirmError ? (
            <p id="confirm-error" className="mt-1 text-sm text-copper">
              {confirmError}
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-copper px-5 text-base font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Working…" : mode === "signup" ? "Create account" : "Log in"}
      </button>
    </form>
  );
}
