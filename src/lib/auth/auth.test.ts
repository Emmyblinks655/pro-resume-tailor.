import assert from "node:assert/strict";
import test from "node:test";

import { safeNextPath } from "./paths";
import { CONFIRM_EMAIL_MESSAGE, friendlyAuthError, isEmailUnconfirmed, validateCredentials } from "./validation";

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
  assert.equal(CONFIRM_EMAIL_MESSAGE.includes("Check your email to confirm"), true);
});
