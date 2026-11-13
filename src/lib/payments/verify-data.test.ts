import assert from "node:assert/strict";
import test from "node:test";

import { chargeFromVerifyBody } from "./verify-data";

const reference = "prt_fee1234";

function verifyBody(data: Record<string, unknown>, status: unknown = true) {
  return { status, data };
}

function withoutKey(value: Record<string, unknown>, key: string): Record<string, unknown> {
  const copy = { ...value };
  delete copy[key];
  return copy;
}

const successData = {
  status: "success",
  reference,
  currency: "NGN",
  amount: 1_015_229,
  requested_amount: 990_000,
};

test("fee pass-through compares requested_amount and keeps the charged total", () => {
  assert.deepEqual(chargeFromVerifyBody(verifyBody(successData), reference), {
    reference,
    amount: 990_000,
    chargedAmount: 1_015_229,
    currency: "NGN",
  });
});

test("missing requested_amount compares the collected amount", () => {
  const data = withoutKey({ ...successData, amount: 990_000 }, "requested_amount");
  assert.deepEqual(chargeFromVerifyBody(verifyBody({ ...data, currency: " ngn " }), reference), {
    reference,
    amount: 990_000,
    chargedAmount: 990_000,
    currency: "NGN",
  });
});

test("non-success verify bodies are rejected", () => {
  assert.equal(chargeFromVerifyBody(verifyBody(successData, false), reference), null);
  assert.equal(chargeFromVerifyBody(verifyBody(successData, "true"), reference), null);
  assert.equal(chargeFromVerifyBody(verifyBody({ ...successData, status: "failed" }), reference), null);
  assert.equal(chargeFromVerifyBody(verifyBody({ ...successData, status: "abandoned" }), reference), null);
});

test("wrong reference is rejected", () => {
  assert.equal(chargeFromVerifyBody(verifyBody({ ...successData, reference: "prt_other12" }), reference), null);
  assert.equal(chargeFromVerifyBody(verifyBody({ ...successData, reference: 990_000 }), reference), null);
});

test("non-number amount is rejected", () => {
  assert.equal(chargeFromVerifyBody(verifyBody({ ...successData, amount: "1015229" }), reference), null);
  assert.equal(chargeFromVerifyBody(verifyBody({ ...successData, requested_amount: "990000" }), reference), null);
  assert.equal(chargeFromVerifyBody(verifyBody({ ...successData, amount: null }), reference), null);
  assert.equal(chargeFromVerifyBody(verifyBody({ ...successData, amount: Number.NaN }), reference), null);
});

test("missing currency is rejected", () => {
  const data = withoutKey(successData, "currency");
  assert.equal(chargeFromVerifyBody(verifyBody(data), reference), null);
  assert.equal(chargeFromVerifyBody(verifyBody({ ...successData, currency: "" }), reference), null);
  assert.equal(chargeFromVerifyBody(verifyBody({ ...successData, currency: "   " }), reference), null);
  assert.equal(chargeFromVerifyBody(verifyBody({ ...successData, currency: 566 }), reference), null);
});
