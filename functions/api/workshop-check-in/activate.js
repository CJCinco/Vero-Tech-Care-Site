import {
  clearSessionCookie,
  createSessionToken,
  ensureConfigured,
  ensureSetupPasswordConfigured,
  errorPayload,
  hasJsonContentType,
  isSameOrigin,
  jsonResponse,
  methodNotAllowed,
  publicEvent,
  readJsonBody,
  secureEqual,
  sessionCookie,
  validateEventInput
} from "../../_lib/checkin.js";

export async function onRequestPost({ request, env }) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ ok: false, code: "ORIGIN_REJECTED", message: "That request was not accepted." }, 403);
  }
  if (!hasJsonContentType(request)) {
    return jsonResponse({ ok: false, code: "INVALID_CONTENT_TYPE", message: "That request was not accepted." }, 415);
  }
  if (
    !env?.CHECKINS_DB ||
    !ensureConfigured(env, ["CHECKIN_SESSION_KEY"]) ||
    !ensureSetupPasswordConfigured(env)
  ) {
    return jsonResponse({ ok: false, code: "SETUP_REQUIRED", message: "Workshop check-in is not configured yet." }, 503);
  }

  try {
    const body = await readJsonBody(request);
    if (!secureEqual(body?.setupPassword, env.CHECKIN_SETUP_PASSWORD)) {
      return jsonResponse({ ok: false, code: "ACCESS_DENIED", message: "The setup password was not accepted." }, 403);
    }

    const event = validateEventInput(body.event);
    if (body.action !== "open" && body.action !== "close") {
      return jsonResponse({ ok: false, code: "INVALID_ACTION", message: "That setup action is not available." }, 400);
    }
    const action = body.action;

    if (action === "close") {
      const result = await env.CHECKINS_DB.prepare(
        "UPDATE events SET status = 'closed', closed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
      )
        .bind(event.id)
        .run();

      if (!result.success || Number(result.meta?.changes || 0) < 1) {
        return jsonResponse({ ok: false, code: "EVENT_NOT_FOUND", message: "That workshop was not found." }, 404);
      }

      return jsonResponse(
        { ok: true, event: { ...event, status: "closed" } },
        200,
        { "Set-Cookie": clearSessionCookie() }
      );
    }

    const sessionGeneration = crypto.randomUUID();
    const result = await env.CHECKINS_DB.prepare(
      `INSERT INTO events
         (id, title, details, status, opened_at, closed_at, updated_at, session_generation,
          aos_verified_at, aos_verified_count, aos_verified_final_sequence, aos_receipt_digest, purged_at)
       VALUES (?, ?, ?, 'open', datetime('now'), NULL, datetime('now'), ?, NULL, NULL, NULL, NULL, NULL)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         details = excluded.details,
         status = 'open',
         opened_at = datetime('now'),
         closed_at = NULL,
         updated_at = datetime('now'),
         session_generation = excluded.session_generation,
         aos_verified_at = NULL,
         aos_verified_count = NULL,
         aos_verified_final_sequence = NULL,
         aos_receipt_digest = NULL,
         purged_at = NULL`
    )
      .bind(event.id, event.title, event.details, sessionGeneration)
      .run();

    if (!result.success) throw new Error("Event activation failed.");
    const token = await createSessionToken(event.id, sessionGeneration, env.CHECKIN_SESSION_KEY);

    return jsonResponse(
      { ok: true, event: publicEvent({ ...event, status: "open" }) },
      200,
      { "Set-Cookie": sessionCookie(token) }
    );
  } catch (error) {
    return errorPayload(error);
  }
}

export function onRequest() {
  return methodNotAllowed("POST");
}
