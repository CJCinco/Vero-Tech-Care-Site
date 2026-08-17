import {
  clearSessionCookie,
  ensureConfigured,
  jsonResponse,
  methodNotAllowed,
  publicEvent,
  requireOpenEvent
} from "../../_lib/checkin.js";

const SUBMISSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export async function onRequestGet({ request, env }) {
  if (!env?.CHECKINS_DB || !ensureConfigured(env, ["CHECKIN_SESSION_KEY"])) {
    return jsonResponse({ ok: false, code: "SETUP_REQUIRED", message: "Workshop check-in is not configured yet." }, 503);
  }

  try {
    const authorized = await requireOpenEvent(request, env);
    if (!authorized) {
      return jsonResponse(
        { ok: false, code: "KIOSK_INACTIVE", message: "This iPad is not ready for check-in." },
        401,
        { "Set-Cookie": clearSessionCookie() }
      );
    }

    const url = new URL(request.url);
    const submissionId = (url.searchParams.get("submission") || "").toLowerCase();
    if (!submissionId) {
      return jsonResponse({ ok: true, event: publicEvent(authorized.event) });
    }
    if (!SUBMISSION_ID_PATTERN.test(submissionId)) {
      return jsonResponse({ ok: false, code: "INVALID_SUBMISSION", message: "That check-in could not be verified." }, 400);
    }

    const saved = await env.CHECKINS_DB.prepare(
      "SELECT receipt_id FROM checkins WHERE event_id = ? AND client_submission_id = ? LIMIT 1"
    )
      .bind(authorized.event.id, submissionId)
      .first();

    return jsonResponse({
      ok: true,
      saved: Boolean(saved),
      receiptId: saved?.receipt_id || null,
      event: publicEvent(authorized.event)
    });
  } catch {
    return jsonResponse(
      { ok: false, code: "TEMPORARILY_UNAVAILABLE", message: "Check-in is temporarily unavailable." },
      503
    );
  }
}

export function onRequest() {
  return methodNotAllowed("GET");
}
