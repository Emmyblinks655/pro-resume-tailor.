import assert from "node:assert/strict";
import test from "node:test";

import { applyOtpDigits, normalizeOtp, otpCaret, readOtpType, shouldTryNextOtpType, verifyPath } from "./otp";
import { safeNextPath } from "./paths";
import { needsOnboarding, profileFromRow, validateProfile, withOnboarding } from "./profile";
import { CONFIRM_EMAIL_MESSAGE, friendlyAuthError, friendlyOtpError, isEmailUnconfirmed, validateCredentials } from "./validation";

test("next paths stay on this site", () => {
  assert.equal(safeNextPath("/tailor"), "/tailor");
  assert.equal(safeNextPath("/dashboard?tab=credits"), "/dashboard?tab=credits");
  assert.equal(safeNextPath("https://evil.example"), "/dashboard");
  assert.equal(safeNextPath("//evil.example"), "/dashboard");
  assert.equal(safeNextPath(null), "/dashboard");
});

test("passwords must be at least 8 characters", () => {
  const short = validateCredentials("ada@example.com", "short");
  assert.equal(short.password, "Use at least 8 characters.");
  const ok = validateCredentials("ada@example.com", "long-enough", "long-enough");
  assert.deepEqual(ok, {});
  const mismatch = validateCredentials("ada@example.com", "long-enough", "different1");
  assert.equal(mismatch.confirm, "Those passwords do not match.");
});

test("unconfirmed email is a confirmation message, not a raw error", () => {
  assert.equal(isEmailUnconfirmed({ code: "email_not_confirmed", message: "Email not confirmed" }), true);
  assert.equal(friendlyAuthError("Email not confirmed"), CONFIRM_EMAIL_MESSAGE);
  assert.equal(CONFIRM_EMAIL_MESSAGE.includes("6-digit"), true);
  assert.equal(friendlyOtpError("Token has expired or is invalid"), "That code is invalid or expired. Request a new one.");
});

test("otp entry keeps six digits and moves the caret", () => {
  assert.equal(normalizeOtp("12-34 56 789"), "123456");
  assert.deepEqual(applyOtpDigits(["", "", "", "", "", ""], 0, "123456"), ["1", "2", "3", "4", "5", "6"]);
  assert.equal(otpCaret(0, "123456"), 5);
  assert.deepEqual(applyOtpDigits(["1", "2", "3", "4", "5", "6"], 2, ""), ["1", "2", "", "4", "5", "6"]);
  assert.equal(readOtpType("email"), "email");
  assert.equal(readOtpType("signup"), "signup");
  assert.equal(shouldTryNextOtpType({ code: "otp_expired", message: "Token has expired or is invalid" }), true);
  assert.equal(shouldTryNextOtpType({ message: "For security purposes you can only request this once every 60 seconds" }), false);
});

test("verify links stay on this site", () => {
  const path = verifyPath("ada@example.com", "https://evil.example", { sent: true });
  const url = new URL(path, "http://localhost");
  assert.equal(url.pathname, "/verify");
  assert.equal(url.searchParams.get("email"), "ada@example.com");
  assert.equal(url.searchParams.get("next"), "/dashboard");
  assert.equal(url.searchParams.get("sent"), "1");
});

test("missing names go to onboarding and finished names do not", () => {
  assert.equal(needsOnboarding(null), true);
  assert.equal(needsOnboarding("  "), true);
  assert.equal(needsOnboarding("Ada Lovelace"), false);
  assert.equal(withOnboarding("/tailor", true), "/onboarding?next=%2Ftailor");
  assert.equal(withOnboarding("/onboarding?next=%2Fdashboard", true), "/onboarding?next=/dashboard");
  assert.equal(withOnboarding("/onboarding?next=%2Fdashboard", false), "/dashboard");
  assert.equal(withOnboarding("https://evil.example", true), "/onboarding?next=%2Fdashboard");
  const ready = profileFromRow({ full_name: "Ada Lovelace", headline: "Frontend developer", email: "ada@example.com" }, null);
  assert.equal(ready.status, "ready");
  assert.equal(ready.headline, "Frontend developer");
  const missing = profileFromRow({ full_name: null, email: "ada@example.com" }, null);
  assert.equal(missing.status, "needs-onboarding");
  assert.equal(validateProfile("", "Frontend developer").fullName, "Enter your full name.");
  assert.deepEqual(validateProfile("Ada Lovelace", ""), {});
});
