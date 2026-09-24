import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createEmbeddedSession,
  readPaymentRequest,
  resolvePaymentEnvironment
} from "../../functions/_lib/payment.js";
import { onRequestGet } from "../../functions/api/payment/config.js";
import { onRequestPost } from "../../functions/api/payment/session.js";

const attemptId = "1e39160c-742a-4a70-9013-4a7f0422fe53";
const localUrl = "http://localhost:8788/api/payment/session";
const testEnv = {
  STRIPE_SECRET_KEY: "sk_test_1234567890abcdef",
  STRIPE_PUBLISHABLE_KEY: "pk_test_1234567890abcdef"
};
const liveEnv = {
  STRIPE_SECRET_KEY: "sk_live_1234567890abcdef",
  STRIPE_PUBLISHABLE_KEY: "pk_live_1234567890abcdef"
};

function request(body, { url = localUrl, origin = new URL(url).origin, headers = {} } = {}) {
  return new Request(url, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      ...headers
    },
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
}

function stripeSession(cents, livemode = false) {
  return {
    mode: "payment",
    ui_mode: "embedded_page",
    currency: "usd",
    amount_total: cents,
    livemode,
    client_secret: "cs_test_sample_secret_1234567890"
  };
}

test("configuration reveals only the publishable key and blocks unsafe host or key modes", async () => {
  const configured = onRequestGet({ request: new Request(localUrl), env: testEnv });
  assert.equal(configured.status, 200);
  assert.deepEqual(await configured.json(), {
    publishableKey: testEnv.STRIPE_PUBLISHABLE_KEY,
    mode: "test"
  });
  assert.equal(configured.headers.get("Cache-Control"), "no-store, max-age=0");

  for (const [url, env] of [
    [localUrl, liveEnv],
    [localUrl, { ...testEnv, STRIPE_PUBLISHABLE_KEY: liveEnv.STRIPE_PUBLISHABLE_KEY }],
    [localUrl, {}],
    ["https://verotechcare.com/api/payment/config", testEnv],
    ["https://www.verotechcare.com/api/payment/config", testEnv],
    ["https://other.example/api/payment/config", liveEnv],
    ["http://site.pages.dev/api/payment/config", testEnv],
    ["https://site.pages.dev/api/payment/config", liveEnv]
  ]) {
    const result = onRequestGet({ request: new Request(url), env });
    assert.equal(result.status, 503);
    assert.deepEqual(await result.json(), { error: "Payment is unavailable right now." });
  }
  assert.equal(resolvePaymentEnvironment(new Request("https://verotechcare.com/api/payment/config"), liveEnv)?.mode, "live");
  assert.equal(resolvePaymentEnvironment(new Request("https://site.pages.dev/api/payment/config"), testEnv)?.mode, "test");
  assert.equal(resolvePaymentEnvironment(new Request(localUrl), {
    ...testEnv,
    STRIPE_SECRET_KEY: "rk_test_1234567890abcdef"
  })?.mode, "test");
});

test("amount parsing accepts exact cents within $1 to $10,000", async () => {
  for (const [amount, cents] of [["1", 100], ["1.2", 120], ["1.23", 123], ["9999.99", 999999], ["10000.00", 1000000]]) {
    assert.deepEqual(await readPaymentRequest(request({ amount, attemptId })), { cents, attemptId });
  }
  for (const amount of ["0.99", "10000.01", "0", "01.00", "1.234", "1e3", " 1", "$1", 1, null]) {
    assert.equal(await readPaymentRequest(request({ amount, attemptId })), null);
  }
  assert.equal(await readPaymentRequest(request({ amount: "10", attemptId, currency: "eur" })), null);
  assert.equal(await readPaymentRequest(request({ amount: "10", attemptId: "not-a-uuid" })), null);
  assert.equal(await readPaymentRequest(request({ amount: "10", attemptId, priceId: "price_1" })), null);
  assert.equal(await readPaymentRequest(request("{")), null);
  assert.equal(await readPaymentRequest(request("x".repeat(513))), null);
  assert.equal(await readPaymentRequest(request({ amount: "10", attemptId }, { headers: { "Content-Type": "text/plain" } })), null);
});

test("session request requires its exact browser origin", async () => {
  const body = { amount: "25.00", attemptId };
  for (const options of [
    { origin: "https://evil.example" },
    { origin: "null" },
    { origin: "http://127.0.0.1:8788" },
    { headers: { "Sec-Fetch-Site": "cross-site" } }
  ]) {
    const result = await onRequestPost({ request: request(body, options), env: testEnv });
    assert.equal(result.status, 403);
  }
  const absentOrigin = request(body);
  absentOrigin.headers.delete("Origin");
  assert.equal((await onRequestPost({ request: absentOrigin, env: testEnv })).status, 403);
});

test("Stripe request is bounded and idempotent for the same browser attempt and amount", async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    const cents = Number(new URLSearchParams(options.body).get("line_items[0][price_data][unit_amount]"));
    return Response.json(stripeSession(cents));
  };
  const config = resolvePaymentEnvironment(new Request(localUrl), testEnv);
  const first = await createEmbeddedSession({ cents: 2500, attemptId }, config, fetcher);
  const again = await createEmbeddedSession({ cents: 2500, attemptId }, config, fetcher);
  await createEmbeddedSession({ cents: 2600, attemptId }, config, fetcher);
  assert.equal(first, "cs_test_sample_secret_1234567890");
  assert.equal(again, first);
  assert.equal(calls[0].url, "https://api.stripe.com/v1/checkout/sessions");
  assert.equal(calls[0].options.headers.Authorization, `Bearer ${testEnv.STRIPE_SECRET_KEY}`);
  assert.equal(calls[0].options.headers["Stripe-Version"], "2026-08-26.dahlia");
  assert.equal(calls[0].options.headers["Idempotency-Key"], calls[1].options.headers["Idempotency-Key"]);
  assert.notEqual(calls[0].options.headers["Idempotency-Key"], calls[2].options.headers["Idempotency-Key"]);

  const fields = new URLSearchParams(calls[0].options.body);
  assert.equal(fields.get("ui_mode"), "embedded_page");
  assert.equal(fields.get("redirect_on_completion"), "never");
  assert.equal(fields.get("payment_method_types[0]"), "card");
  assert.equal(fields.get("payment_method_types[1]"), "link");
  assert.deepEqual([...fields].filter(([key]) => key.startsWith("payment_method_types")).map(([, value]) => value), ["card", "link"]);
  assert.equal(fields.get("line_items[0][price_data][currency]"), "usd");
  assert.equal(fields.get("line_items[0][price_data][unit_amount]"), "2500");
  assert.equal(fields.get("line_items[0][price_data][product_data][name]"), "Vero Tech Care Payment");
  assert.equal(fields.get("name_collection[individual][enabled]"), "true");
  assert.equal(fields.get("name_collection[individual][optional]"), "false");
  assert.equal(fields.get("custom_fields[0][key]"), "service_reference");
  assert.equal(fields.get("custom_fields[0][optional]"), "false");
  assert.equal(fields.has("automatic_tax[enabled]"), false);
  assert.equal(fields.has("success_url"), false);
  assert.equal(fields.has("return_url"), false);
});

test("upstream failures and unexpected sessions do not leak Stripe payloads", async () => {
  const config = resolvePaymentEnvironment(new Request(localUrl), testEnv);
  const payment = { cents: 2500, attemptId };
  assert.equal(await createEmbeddedSession(payment, config, async () => new Response("secret internal error", { status: 400 })), null);
  assert.equal(await createEmbeddedSession(payment, config, async () => Response.json({ ...stripeSession(2500), livemode: true })), null);
  assert.equal(await createEmbeddedSession(payment, config, async () => Response.json({ ...stripeSession(2501) })), null);
  assert.equal(await createEmbeddedSession(payment, config, async () => Response.json({ error: "secret internal error" })), null);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("secret internal error", { status: 500 });
  try {
    const result = await onRequestPost({ request: request({ amount: "25", attemptId }), env: testEnv });
    assert.equal(result.status, 502);
    const raw = await result.text();
    assert.equal(raw.includes("secret"), false);
    assert.equal(raw.includes(testEnv.STRIPE_SECRET_KEY), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
