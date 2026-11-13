"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { alertClass, primaryButtonClass, quietButtonClass, textFieldClass } from "@/components/field-styles";
import { OtpInput } from "@/components/otp-input";
import { OTP_LENGTH, RESEND_COOLDOWN_SECONDS } from "@/lib/auth/otp";
import {
  resendSignupCode,
  verifyEmailCode,
  type ResendFormState,
  type VerifyFormState,
} from "@/lib/auth/verify-actions";

const emptyVerify: VerifyFormState = { error: null };
const emptyResend: ResendFormState = { error: null, message: null };

function storageKey(email: string): string {
  return `prt-otp-resend:${email}`;
}

export function VerifyForm({
  initialEmail,
  nextPath,
  otpType,
  justSent,
  statusNote,
}: {
  initialEmail: string;
  nextPath: string;
  otpType: "signup" | "email";
  justSent: boolean;
  statusNote: string | null;
}) {
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyEmailCode, emptyVerify);
  const [resendState, setResendState] = useState(emptyResend);
  const [resendPending, setResendPending] = useState(false);
  const [emailValue, setEmailValue] = useState(initialEmail);
  const [editingEmail, setEditingEmail] = useState(initialEmail.length === 0);
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length: OTP_LENGTH }, () => ""));
  const [remaining, setRemaining] = useState(justSent ? RESEND_COOLDOWN_SECONDS : 0);
  const formRef = useRef<HTMLFormElement>(null);
  const lastSubmitted = useRef("");
  const token = digits.join("");

  useEffect(() => {
    const key = storageKey(emailValue);
    const stored = Number(window.sessionStorage.getItem(key) ?? "0");
    const fresh =
      emailValue === initialEmail && justSent ? Date.now() + RESEND_COOLDOWN_SECONDS * 1000 : 0;
    const until = Math.max(stored, fresh);
    if (emailValue && until > Date.now() && until !== stored) {
      window.sessionStorage.setItem(key, String(until));
    }
    let id = 0;
    const tick = () => {
      const current = Number(window.sessionStorage.getItem(key) ?? "0");
      const left = Math.max(0, Math.ceil((current - Date.now()) / 1000));
      setRemaining((previous) => (previous === left ? previous : left));
      if (left <= 0) window.clearInterval(id);
    };
    const timeout = window.setTimeout(tick, 0);
    id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(id);
    };
  }, [emailValue, initialEmail, justSent]);

  useEffect(() => {
    if (token.length !== OTP_LENGTH || token === lastSubmitted.current || verifyPending) return;
    lastSubmitted.current = token;
    formRef.current?.requestSubmit();
  }, [token, verifyPending]);

  async function onResend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (resendPending || remaining > 0) return;
    const formData = new FormData(event.currentTarget);
    setResendPending(true);
    try {
      const result = await resendSignupCode(emptyResend, formData);
      setResendState(result);
      if (!result.message) return;
      const until = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
      if (emailValue) window.sessionStorage.setItem(storageKey(emailValue), String(until));
      setRemaining(RESEND_COOLDOWN_SECONDS);
      setDigits(Array.from({ length: OTP_LENGTH }, () => ""));
      lastSubmitted.current = "";
    } finally {
      setResendPending(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      {statusNote ? (
        <p role="status" className={alertClass}>
          {statusNote}
        </p>
      ) : null}
      {verifyState.error ? (
        <p role="alert" className={alertClass}>
          {verifyState.error}
        </p>
      ) : null}

      {editingEmail ? (
        <div>
          <label htmlFor="verify-email" className="text-sm font-semibold">
            Email
          </label>
          <input
            id="verify-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={emailValue}
            autoFocus={initialEmail.length === 0}
            onChange={(event) => setEmailValue(event.target.value)}
            className={textFieldClass}
          />
        </div>
      ) : (
        <div className="rounded-2xl bg-paper px-4 py-3">
          <p className="text-sm text-ink-soft">Code sent to</p>
          <p className="mt-1 text-base font-semibold break-all">{emailValue}</p>
          <button
            type="button"
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline"
            onClick={() => setEditingEmail(true)}
          >
            Use a different email
          </button>
        </div>
      )}

      <form ref={formRef} action={verifyAction} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={nextPath} />
        <input type="hidden" name="otpType" value={otpType} />
        <input type="hidden" name="email" value={emailValue} />
        <input type="hidden" name="token" value={token} />
        <fieldset>
          <legend className="text-sm font-semibold">6-digit code</legend>
          <div className="mt-2">
            <OtpInput
              digits={digits}
              invalid={Boolean(verifyState.error)}
              autoFocusFirst={initialEmail.length > 0}
              onDigits={setDigits}
            />
          </div>
        </fieldset>
        <button type="submit" disabled={verifyPending} className={primaryButtonClass}>
          {verifyPending ? "Checking…" : "Confirm code"}
        </button>
      </form>

      <form onSubmit={onResend} className="space-y-3">
        <input type="hidden" name="email" value={emailValue} />
        <input type="hidden" name="next" value={nextPath} />
        {resendState.error ? (
          <p role="alert" className={alertClass}>
            {resendState.error}
          </p>
        ) : null}
        {resendState.message ? (
          <p role="status" className={alertClass}>
            {resendState.message}
          </p>
        ) : null}
        <button type="submit" disabled={resendPending || remaining > 0 || emailValue.trim().length === 0} className={quietButtonClass}>
          {resendPending ? "Sending…" : remaining > 0 ? `Resend code in ${remaining}s` : "Resend code"}
        </button>
      </form>
    </div>
  );
}
