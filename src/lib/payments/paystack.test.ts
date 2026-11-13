import assert from "node:assert/strict";
import test from "node:test";

import { externalHttpUrl } from "../jobs/text";
import { paystackCallbackUrl, siteUrl } from "../site";
import {
  checkoutFallbackPath,
  DEFAULT_PRICE_AMOUNT_MINOR,
  paystackAuthorizationUrl,
  paystackCurrency,
  paymentRedirectPath,
  priceAmountMinor,
} from "./paystack-config";
import { paystackSignature, paystackSignatureMatches } from "./signature";

test("paystack callback is the public site plus the fixed path", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    process.env.NEXT_PUBLIC_SITE_URL = "https://proresumetailor.com";
    assert.equal(paystackCallbackUrl(), "https://proresumetailor.com/api/paystack/callback");
    delete process.env.NEXT_PUBLIC_SITE_URL;
    assert.equal(siteUrl(), "https://proresumetailor.com");
    assert.equal(paystackCallbackUrl(), "https://proresumetailor.com/api/paystack/callback");
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000/";
    assert.equal(paystackCallbackUrl(), "http://localhost:3000/api/paystack/callback");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});

test("naira pack defaults to 990000 kobo", () => {
  const previousAmount = process.env.PRICE_AMOUNT_MINOR;
  const previousCurrency = process.env.PAYSTACK_CURRENCY;
  try {
    delete process.env.PRICE_AMOUNT_MINOR;
    delete process.env.PAYSTACK_CURRENCY;
    assert.equal(DEFAULT_PRICE_AMOUNT_MINOR, 990_000);
    assert.equal(priceAmountMinor(), 990_000);
    assert.equal(paystackCurrency(), "NGN");
    process.env.PRICE_AMOUNT_MINOR = "990000";
    assert.equal(priceAmountMinor(), 990_000);
    process.env.PRICE_AMOUNT_MINOR = "nope";
    assert.equal(priceAmountMinor(), 990_000);
  } finally {
    if (previousAmount === undefined) delete process.env.PRICE_AMOUNT_MINOR;
    else process.env.PRICE_AMOUNT_MINOR = previousAmount;
    if (previousCurrency === undefined) delete process.env.PAYSTACK_CURRENCY;
    else process.env.PAYSTACK_CURRENCY = previousCurrency;
  }
});

test("checkout without a live session stays on this site", () => {
  assert.equal(checkoutFallbackPath(false), "/signup?next=/pricing");
  assert.equal(checkoutFallbackPath(true), "/dashboard");
  assert.equal(paymentRedirectPath("success"), "/dashboard?payment=success");
  assert.equal(paymentRedirectPath("failed"), "/dashboard?payment=failed");
});

test("paystack signature uses the raw body", () => {
  const body = JSON.stringify({ event: "charge.success", data: { reference: "prt_abc12345" } });
  const secret = "test-secret";
  const signature = paystackSignature(body, secret);
  assert.equal(signature.length, 128);
  assert.equal(paystackSignatureMatches(body, secret, signature), true);
  assert.equal(paystackSignatureMatches(body, secret, signature.toUpperCase()), true);
  assert.equal(paystackSignatureMatches(body, secret, null), false);
  assert.equal(paystackSignatureMatches(`${body} `, secret, signature), false);
  assert.equal(paystackSignatureMatches(body, "other", signature), false);
});

test("checkout urls stay on paystack", () => {
  assert.equal(
    paystackAuthorizationUrl("https://checkout.paystack.com/abc123"),
    "https://checkout.paystack.com/abc123",
  );
  assert.equal(paystackAuthorizationUrl("https://evil.example/pay"), null);
  assert.equal(paystackAuthorizationUrl("http://checkout.paystack.com/abc"), null);
});

test("job links are http(s) only", () => {
  assert.equal(externalHttpUrl("https://remotive.com/remote-jobs/1"), "https://remotive.com/remote-jobs/1");
  assert.equal(externalHttpUrl("#"), null);
  assert.equal(externalHttpUrl("javascript:alert(1)"), null);
  assert.equal(externalHttpUrl(""), null);
});
