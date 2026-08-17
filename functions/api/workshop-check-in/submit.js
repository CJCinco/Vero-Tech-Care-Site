import {
  DISCLOSURE_VERSION,
  ensureConfigured,
  errorPayload,
  hasJsonContentType,
  isSameOrigin,
  jsonResponse,
  methodNotAllowed,
  readJsonBody,
  requireOpenEvent,
  validateSubmission
} from "../../_lib/checkin.js";

async function findSavedSubmission(database, eventId, clientSubmissionId) {
  return database
    .prepare(
      `SELECT receipt_id, sequence, full_name, email, phone, email_provided_under_disclosure
       FROM checkins
       WHERE event_id = ? AND client_submission_id = ?
       LIMIT 1`
    )
    .bind(eventId, clientSubmissionId)
    .first();
}

function matchesSubmission(saved, submission) {
  return (
    saved.full_name === submission.fullName &&
    saved.email === submission.email &&
    saved.phone === submission.phone &&
    Number(saved.email_provided_under_disclosure) === submission.emailProvidedUnderDisclosure
  );
}

function conflictResponse() {
  return jsonResponse(
    {
      ok: false,
      saved: false,
      code: "SUBMISSION_CONFLICT",
      message: "This form needs a fresh submission. Please tap Try again."
    },
    409
  );
}

function confirmation(saved, duplicate = false) {
  return {
    ok: true,
    saved: true,
    duplicate,
    receiptId: saved.receipt_id
  };
}

export async function onRequestPost({ request, env }) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ ok: false, code: "ORIGIN_REJECTED", message: "That request was not accepted." }, 403);
  }
  if (!hasJsonContentType(request)) {
    return jsonResponse({ ok: false, code: "INVALID_CONTENT_TYPE", message: "That request was not accepted." }, 415);
  }
  if (!env?.CHECKINS_DB || !ensureConfigured(env, ["CHECKIN_SESSION_KEY"])) {
    return jsonResponse({ ok: false, code: "SETUP_REQUIRED", message: "Workshop check-in is not configured yet." }, 503);
  }

  try {
    const authorized = await requireOpenEvent(request, env);
    if (!authorized) {
      return jsonResponse({ ok: false, code: "KIOSK_INACTIVE", message: "This iPad is not ready for check-in." }, 401);
    }
    const submission = validateSubmission(await readJsonBody(request));
    const existing = await findSavedSubmission(
      env.CHECKINS_DB,
      authorized.event.id,
      submission.clientSubmissionId
    );
    if (existing) {
      if (!matchesSubmission(existing, submission)) return conflictResponse();
      return jsonResponse(confirmation(existing, true));
    }

    const receiptId = crypto.randomUUID();
    try {
      await env.CHECKINS_DB.prepare(
        `INSERT INTO checkins
          (receipt_id, event_id, client_submission_id, full_name, email, phone,
           email_provided_under_disclosure, disclosure_version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          receiptId,
          authorized.event.id,
          submission.clientSubmissionId,
          submission.fullName,
          submission.email,
          submission.phone,
          submission.emailProvidedUnderDisclosure,
          submission.email ? DISCLOSURE_VERSION : ""
        )
        .run();
    } catch {
      const recovered = await findSavedSubmission(
        env.CHECKINS_DB,
        authorized.event.id,
        submission.clientSubmissionId
      );
      if (recovered) {
        if (!matchesSubmission(recovered, submission)) return conflictResponse();
        return jsonResponse(confirmation(recovered, true));
      }
      throw new Error("Insert failed.");
    }

    const saved = await findSavedSubmission(
      env.CHECKINS_DB,
      authorized.event.id,
      submission.clientSubmissionId
    );
    if (!saved || saved.receipt_id !== receiptId) throw new Error("Insert readback failed.");

    return jsonResponse(confirmation(saved), 201);
  } catch (error) {
    return errorPayload(error);
  }
}

export function onRequest() {
  return methodNotAllowed("POST");
}
