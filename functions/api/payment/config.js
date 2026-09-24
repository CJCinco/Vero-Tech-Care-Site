import { jsonResponse, paymentError, resolvePaymentEnvironment } from "../../_lib/payment.js";

export function onRequestGet({ request, env }) {
  const config = resolvePaymentEnvironment(request, env);
  if (!config) return paymentError(503, "Payment is unavailable right now.");
  return jsonResponse({ publishableKey: config.publishableKey, mode: config.mode });
}
