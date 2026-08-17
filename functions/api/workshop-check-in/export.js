import {
  ensureConfigured,
  jsonResponse,
  methodNotAllowed,
  secureEqual
} from "../../_lib/checkin.js";

const EVENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,79}$/;

function readBearerToken(request) {
  const authorization = request.headers.get("Authorization") || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
}

export async function onRequestGet({ request, env }) {
  if (!env?.CHECKINS_DB || !ensureConfigured(env, ["CHECKIN_EXPORT_TOKEN"])) {
    return jsonResponse({ ok: false, code: "SETUP_REQUIRED", message: "Export is not configured yet." }, 503);
  }
  if (!secureEqual(readBearerToken(request), env.CHECKIN_EXPORT_TOKEN)) {
    return jsonResponse({ ok: false, code: "ACCESS_DENIED", message: "Export access was not accepted." }, 403);
  }

  const url = new URL(request.url);
  const eventId = (url.searchParams.get("event") || "").toLowerCase();
  const after = Number(url.searchParams.get("after") || 0);
  const requestedLimit = Number(url.searchParams.get("limit") || 200);
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 200;

  if (!EVENT_ID_PATTERN.test(eventId) || !Number.isInteger(after) || after < 0) {
    return jsonResponse({ ok: false, code: "INVALID_EXPORT_REQUEST", message: "The export request was not valid." }, 400);
  }

  try {
    const event = await env.CHECKINS_DB.prepare(
      "SELECT id, title, details, status FROM events WHERE id = ? LIMIT 1"
    )
      .bind(eventId)
      .first();
    if (!event) {
      return jsonResponse({ ok: false, code: "EVENT_NOT_FOUND", message: "That workshop was not found." }, 404);
    }

    const snapshot = await env.CHECKINS_DB.prepare(
      `SELECT COUNT(*) AS total_count, COALESCE(MAX(sequence), 0) AS final_sequence
       FROM checkins
       WHERE event_id = ?`
    )
      .bind(eventId)
      .first();
    const totalCount = Number(snapshot?.total_count || 0);
    const finalSequence = Number(snapshot?.final_sequence || 0);

    const query = await env.CHECKINS_DB.prepare(
      `SELECT sequence, receipt_id, event_id, full_name, email, phone,
              email_provided_under_disclosure, disclosure_version, created_at
       FROM checkins
       WHERE event_id = ? AND sequence > ? AND sequence <= ?
       ORDER BY sequence ASC
       LIMIT ?`
    )
      .bind(eventId, after, finalSequence, limit + 1)
      .all();

    const allRows = query.results || [];
    const hasMore = allRows.length > limit;
    const rows = allRows.slice(0, limit).map((row) => ({
      sequence: row.sequence,
      receiptId: row.receipt_id,
      eventId: row.event_id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      emailProvidedUnderDisclosure: Boolean(row.email_provided_under_disclosure),
      disclosureVersion: row.disclosure_version,
      checkedInAt: row.created_at
    }));
    const nextCursor = rows.length ? rows[rows.length - 1].sequence : after;

    return jsonResponse({
      ok: true,
      event: {
        id: event.id,
        title: event.title,
        details: event.details,
        status: event.status
      },
      rows,
      nextCursor,
      hasMore,
      totalCount,
      finalSequence
    });
  } catch {
    return jsonResponse(
      { ok: false, code: "TEMPORARILY_UNAVAILABLE", message: "The export could not be completed yet." },
      503
    );
  }
}

export function onRequest() {
  return methodNotAllowed("GET");
}
