import assert from "node:assert/strict";
import test from "node:test";

import { FAQ } from "./copy";
import { SUPPORT_EMAIL, SUPPORT_SUBJECT, resolveSupportEmail, supportMailto } from "./support";

test("support email falls back when the override is missing or unsafe", () => {
  assert.equal(resolveSupportEmail(undefined), "alphahublimited@gmail.com");
  assert.equal(resolveSupportEmail("   "), "alphahublimited@gmail.com");
  assert.equal(resolveSupportEmail("not-an-email"), "alphahublimited@gmail.com");
  assert.equal(resolveSupportEmail("a@b.com?bcc=evil@x.com"), "alphahublimited@gmail.com");
  assert.equal(resolveSupportEmail("buyer-help@example.com\nBcc:evil@x.com"), "alphahublimited@gmail.com");
  assert.equal(resolveSupportEmail("  buyer-help@example.com  "), "buyer-help@example.com");
});

test("mailto uses the shared inbox and the support subject", () => {
  const href = supportMailto();
  const url = new URL(href);
  assert.equal(url.protocol, "mailto:");
  assert.equal(href.startsWith(`mailto:${SUPPORT_EMAIL}?subject=`), true);
  assert.equal(url.searchParams.get("subject"), SUPPORT_SUBJECT);
});

test("faq points payment problems at the shared support inbox", () => {
  const item = FAQ.find((entry) => entry.question === "What if a payment does not go through?");
  assert.ok(item);
  assert.equal(item.answer.includes(SUPPORT_EMAIL), true);
  assert.equal(item.answer.toLowerCase().includes("payment reference"), true);
});
