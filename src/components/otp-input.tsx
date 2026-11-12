"use client";

import { useRef } from "react";

import { OTP_LENGTH, applyOtpDigits, otpCaret } from "@/lib/auth/otp";

export function OtpInput({
  digits,
  invalid,
  autoFocusFirst = false,
  onDigits,
}: {
  digits: string[];
  invalid?: boolean;
  autoFocusFirst?: boolean;
  onDigits: (digits: string[]) => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function focusAt(index: number) {
    const input = refs.current[index];
    input?.focus();
    input?.select();
  }

  function fill(index: number, raw: string) {
    onDigits(applyOtpDigits(digits, index, raw));
    const caret = otpCaret(index, raw);
    requestAnimationFrame(() => focusAt(caret));
  }

  return (
    <div className="grid grid-cols-6 gap-1.5 sm:gap-2" role="group" aria-label="6-digit code">
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={digits[index] ?? ""}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoCorrect="off"
          spellCheck={false}
          pattern="[0-9]*"
          maxLength={OTP_LENGTH}
          autoFocus={autoFocusFirst && index === 0}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          aria-invalid={invalid || undefined}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => fill(index, event.target.value)}
          onPaste={(event) => {
            const data = event.clipboardData;
            if (!data) return;
            const pasted = data.getData("text/plain") || data.getData("text");
            if (!pasted) return;
            event.preventDefault();
            fill(index, pasted);
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index] && index > 0) {
              event.preventDefault();
              onDigits(applyOtpDigits(digits, index - 1, ""));
              focusAt(index - 1);
            }
            if (event.key === "ArrowLeft" && index > 0) {
              event.preventDefault();
              focusAt(index - 1);
            }
            if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
              event.preventDefault();
              focusAt(index + 1);
            }
          }}
          className="h-14 w-full min-w-0 rounded-2xl border border-line bg-paper text-center text-2xl font-semibold text-ink tabular-nums outline-none"
        />
      ))}
    </div>
  );
}
