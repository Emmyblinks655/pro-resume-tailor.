import assert from "node:assert/strict";
import test from "node:test";

import { safeNextPath } from "./paths";
import { validateCredentials } from "./validation";

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
