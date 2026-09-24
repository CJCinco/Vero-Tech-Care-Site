const MAX_BODY_BYTES = 512;
const MAX_STRIPE_RESPONSE_BYTES = 65536;
const STRIPE_API_VERSION = "2026-08-26.dahlia";

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive"
    }
  });
}

export function paymentError(status, message) {
  return jsonResponse({ error: message }, status);
}

export function resolvePaymentEnvironment(request, env) {
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  const isProductionHost = hostname === "verotechcare.com" || hostname === "www.verotechcare.com";
  const isLoopback = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  const isPreviewHost = hostname.endsWith(".pages.dev");
  if (!isProductionHost && !isLoopback && !isPreviewHost) return null;
  if (!isLoopback && url.protocol !== "https:") return null;
  if (isLoopback && url.protocol !== "http:" && url.protocol !== "https:") return null;

  const secretKey = env?.STRIPE_SECRET_KEY;
  const publishableKey = env?.STRIPE_PUBLISHABLE_KEY;
  if (typeof secretKey !== "string" || typeof publishableKey !== "string") return null;

  const secretMode = /^(?:sk|rk)_(test|live)_[A-Za-z0-9]{8,}$/.exec(secretKey)?.[1];
  const publishableMode = /^pk_(test|live)_[A-Za-z0-9]{8,}$/.exec(publishableKey)?.[1];
  if (!secretMode || secretMode !== publishableMode) return null;
  if (isProductionHost && secretMode !== "live") return null;
  if (!isProductionHost && secretMode !== "test") return null;

  return { origin: url.origin, mode: secretMode, secretKey, publishableKey };
}

export function isSameOriginPost(request, origin) {
  return request.headers.get("Origin") === origin &&
    !["cross-site", "same-site"].includes(request.headers.get("Sec-Fetch-Site"));
}

async function readBoundedText(response, limit) {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export async function readPaymentRequest(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType)) return null;
  const contentLength = request.headers.get("Content-Length");
  if (contentLength !== null && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_BODY_BYTES)) return null;
  const raw = await readBoundedText(request, MAX_BODY_BYTES);
  if (raw === null) return null;

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  if (Object.keys(body).some((key) => !["amount", "attemptId", "currency"].includes(key))) return null;
  if (body.currency !== undefined && body.currency !== "usd") return null;
  if (typeof body.amount !== "string" || !/^[1-9]\d{0,4}(?:\.\d{1,2})?$/.test(body.amount)) return null;

  const [dollars, fraction = ""] = body.amount.split(".");
  const cents = Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents < 100 || cents > 1_000_000) return null;
  if (typeof body.attemptId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.attemptId)) return null;

  return { cents, attemptId: body.attemptId.toLowerCase() };
}

async function idempotencyKey(attemptId, cents) {
  const bytes = new TextEncoder().encode(`vtc-pay-v1:usd:${cents}:${attemptId}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `vtc-pay-v1-${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function createEmbeddedSession({ cents, attemptId }, config, fetcher = fetch) {
  const fields = new URLSearchParams({
    mode: "payment",
    ui_mode: "embedded_page",
    redirect_on_completion: "never",
    "payment_method_types[0]": "card",
    "payment_method_types[1]": "link",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(cents),
    "line_items[0][price_data][product_data][name]": "Vero Tech Care Payment",
    "line_items[0][quantity]": "1",
    "name_collection[individual][enabled]": "true",
    "name_collection[individual][optional]": "false",
    "custom_fields[0][key]": "service_reference",
    "custom_fields[0][label][type]": "custom",
    "custom_fields[0][label][custom]": "Service or invoice reference",
    "custom_fields[0][type]": "text",
    "custom_fields[0][optional]": "false",
    "custom_fields[0][text][maximum_length]": "100"
  });

  let upstream;
  try {
    upstream = await fetcher("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": await idempotencyKey(attemptId, cents),
        "Stripe-Version": STRIPE_API_VERSION
      },
      body: fields.toString(),
      signal: AbortSignal.timeout(10000)
    });
  } catch {
    return null;
  }
  if (!upstream.ok) return null;
  const raw = await readBoundedText(upstream, MAX_STRIPE_RESPONSE_BYTES);
  if (raw === null) return null;
  let session;
  try {
    session = JSON.parse(raw);
  } catch {
    return null;
  }
  if (session?.mode !== "payment" || session.ui_mode !== "embedded_page" ||
      session.currency !== "usd" || session.amount_total !== cents ||
      session.livemode !== (config.mode === "live") ||
      typeof session.client_secret !== "string" ||
      session.client_secret.length < 16 || session.client_secret.length > 1024 ||
      !session.client_secret.includes("_secret_")) return null;
  return session.client_secret;
}
