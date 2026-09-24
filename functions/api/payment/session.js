import {
  createEmbeddedSession,
  isSameOriginPost,
  paymentError,
  readPaymentRequest,
  resolvePaymentEnvironment,
  jsonResponse
} from "../../_lib/payment.js";

export async function onRequestPost({ request, env }) {
  const config = resolvePaymentEnvironment(request, env);
  if (!config) return paymentError(503, "Payment is unavailable right now.");
  if (!isSameOriginPost(request, config.origin)) return paymentError(403, "Payment request was not allowed.");

  const payment = await readPaymentRequest(request);
  if (!payment) return paymentError(400, "Enter a valid amount and try again.");

  const clientSecret = await createEmbeddedSession(payment, config);
  if (!clientSecret) return paymentError(502, "Payment could not start. Please try again.");
  return jsonResponse({ clientSecret });
}
