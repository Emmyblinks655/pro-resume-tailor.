"use client";

import { useActionState } from "react";

import { alertClass, primaryButtonClass, textFieldClass } from "@/components/field-styles";
import { saveOnboarding, type OnboardingState } from "@/lib/auth/onboarding-actions";
import { HEADLINE_MAX, NAME_MAX } from "@/lib/auth/profile";

const emptyState: OnboardingState = { error: null, fieldErrors: {} };

export function OnboardingForm({
  nextPath,
  fullName,
  headline,
}: {
  nextPath: string;
  fullName: string;
  headline: string;
}) {
  const [state, action, pending] = useActionState(saveOnboarding, emptyState);

  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="next" value={nextPath} />
      {state.error ? (
        <p role="alert" className={alertClass}>
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="fullName" className="text-sm font-semibold">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          enterKeyHint="next"
          required
          maxLength={NAME_MAX}
          defaultValue={fullName}
          aria-invalid={state.fieldErrors.fullName ? true : undefined}
          aria-describedby={state.fieldErrors.fullName ? "fullName-error" : undefined}
          className={textFieldClass}
        />
        {state.fieldErrors.fullName ? (
          <p id="fullName-error" className="mt-1 text-sm text-copper">
            {state.fieldErrors.fullName}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="headline" className="text-sm font-semibold">
          Role or title <span className="font-normal text-ink-soft">(optional)</span>
        </label>
        <input
          id="headline"
          name="headline"
          type="text"
          autoComplete="organization-title"
          enterKeyHint="done"
          maxLength={HEADLINE_MAX}
          placeholder="Frontend developer"
          defaultValue={headline}
          aria-invalid={state.fieldErrors.headline ? true : undefined}
          aria-describedby="headline-hint"
          className={textFieldClass}
        />
        <p id="headline-hint" className="mt-1 text-sm text-ink-soft">
          For example, Frontend developer or Freelance designer.
        </p>
        {state.fieldErrors.headline ? (
          <p className="mt-1 text-sm text-copper">{state.fieldErrors.headline}</p>
        ) : null}
      </div>

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
