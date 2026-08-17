import {
  ensureConfigured,
  hasJsonContentType,
  jsonResponse,
  loadRosterProof,
  methodNotAllowed,
  readJsonBody,
  secureEqual
} from "../../_lib/checkin.js";

const EVENT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,79}$/;
const DIGEST_PATTERN = /^[0-9a-f]{64}$/;
const RETENTION_DAYS = 30;

function readBearerToken(request) {
  const authorization = request.headers.get("Authorization") || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
}

function parseDatabaseTimestamp(value) {
  if (typeof value !== "string") return Number.NaN;
  return Date.parse(`${value.replace(" ", "T")}Z`);
}

export async function onRequestPost({ request, env }) {
  if (!hasJsonContentType(request)) {
    return jsonResponse({ ok: false, code: "INVALID_CONTENT_TYPE", message: "That request was not accepted." }, 415);
  }
  if (!env?.CHECKINS_DB || !ensureConfigured(env, ["CHECKIN_ADMIN_TOKEN"])) {
    return jsonResponse({ ok: false, code: "SETUP_REQUIRED", message: "Roster custody is not configured yet." }, 503);
  }
  if (!secureEqual(readBearerToken(request), env.CHECKIN_ADMIN_TOKEN)) {
    return jsonResponse({ ok: false, code: "ACCESS_DENIED", message: "Roster custody access was not accepted." }, 403);
  }

  try {
    const body = await readJsonBody(request);
    const eventId = typeof body.eventId === "string" ? body.eventId.toLowerCase() : "";
    if (!EVENT_ID_PATTERN.test(eventId) || (body.action !== "verify" && body.action !== "purge")) {
      return jsonResponse({ ok: false, code: "INVALID_ARCHIVE_REQUEST", message: "The roster custody request was not valid." }, 400);
    }

    const event = await env.CHECKINS_DB.prepare(
      `SELECT id, status, aos_verified_at, aos_verified_count,
              aos_verified_final_sequence, aos_receipt_digest, purged_at
       FROM events
       WHERE id = ?
       LIMIT 1`
    )
      .bind(eventId)
      .first();
    if (!event) {
      return jsonResponse({ ok: false, code: "EVENT_NOT_FOUND", message: "That workshop was not found." }, 404);
    }
    if (event.status !== "closed") {
      return jsonResponse({ ok: false, code: "EVENT_OPEN", message: "Close the workshop before archiving its roster." }, 409);
    }

    if (body.action === "verify") {
      const suppliedCount = body.receiptCount;
      const suppliedFinalSequence = body.finalSequence;
      const suppliedDigest = typeof body.receiptDigest === "string" ? body.receiptDigest.toLowerCase() : "";
      if (
        !Number.isInteger(suppliedCount) ||
        suppliedCount < 0 ||
        !Number.isInteger(suppliedFinalSequence) ||
        suppliedFinalSequence < 0 ||
        !DIGEST_PATTERN.test(suppliedDigest)
      ) {
        return jsonResponse({ ok: false, code: "INVALID_ARCHIVE_PROOF", message: "The roster custody proof was not valid." }, 400);
      }

      const proof = await loadRosterProof(env.CHECKINS_DB, eventId);
      if (
        proof.count !== suppliedCount ||
        proof.finalSequence !== suppliedFinalSequence ||
        !secureEqual(proof.digest, suppliedDigest)
      ) {
        return jsonResponse({ ok: false, code: "ARCHIVE_MISMATCH", message: "The local and remote rosters did not match." }, 409);
      }

      const result = await env.CHECKINS_DB.prepare(
        `UPDATE events
         SET aos_verified_at = datetime('now'),
             aos_verified_count = ?,
             aos_verified_final_sequence = ?,
             aos_receipt_digest = ?,
             purged_at = NULL,
             updated_at = datetime('now')
         WHERE id = ? AND status = 'closed'`
      )
        .bind(proof.count, proof.finalSequence, proof.digest, eventId)
        .run();
      if (!result.success || Number(result.meta?.changes || 0) !== 1) {
        throw new Error("Roster custody acknowledgement failed.");
      }

      return jsonResponse({ ok: true, verified: true, receiptCount: proof.count, retentionDays: RETENTION_DAYS });
    }

    if (event.purged_at) {
      return jsonResponse({ ok: true, purged: true, alreadyPurged: true, removedCount: 0 });
    }
    const verifiedAt = parseDatabaseTimestamp(event.aos_verified_at);
    const eligibleAt = verifiedAt + RETENTION_DAYS * 24 * 60 * 60 * 1000;
    if (!Number.isFinite(verifiedAt) || Date.now() < eligibleAt) {
      return jsonResponse(
        { ok: false, code: "RETENTION_NOT_COMPLETE", message: "This verified roster is not eligible for remote deletion yet." },
        409
      );
    }

    const proof = await loadRosterProof(env.CHECKINS_DB, eventId);
    if (
      proof.count !== Number(event.aos_verified_count) ||
      proof.finalSequence !== Number(event.aos_verified_final_sequence) ||
      !secureEqual(proof.digest, event.aos_receipt_digest || "")
    ) {
      return jsonResponse({ ok: false, code: "ARCHIVE_MISMATCH", message: "Remote deletion stopped because the roster changed." }, 409);
    }

    const [deleted, marked] = await env.CHECKINS_DB.batch([
      env.CHECKINS_DB.prepare(
        `DELETE FROM checkins
         WHERE event_id = ?
           AND EXISTS (
             SELECT 1 FROM events
             WHERE id = ?
               AND status = 'closed'
               AND aos_verified_at = ?
               AND aos_verified_count = ?
               AND aos_verified_final_sequence = ?
               AND aos_receipt_digest = ?
           )
           AND (SELECT COUNT(*) FROM checkins WHERE event_id = ?) = ?
           AND (SELECT COALESCE(MAX(sequence), 0) FROM checkins WHERE event_id = ?) = ?`
      ).bind(
        eventId,
        eventId,
        event.aos_verified_at,
        proof.count,
        proof.finalSequence,
        proof.digest,
        eventId,
        proof.count,
        eventId,
        proof.finalSequence
      ),
      env.CHECKINS_DB.prepare(
        `UPDATE events
         SET purged_at = datetime('now'), updated_at = datetime('now')
         WHERE id = ?
           AND status = 'closed'
           AND aos_verified_at = ?
           AND aos_verified_count = ?
           AND aos_verified_final_sequence = ?
           AND aos_receipt_digest = ?`
      ).bind(
        eventId,
        event.aos_verified_at,
        proof.count,
        proof.finalSequence,
        proof.digest
      )
    ]);
    if (
      !deleted.success ||
      !marked.success ||
      Number(deleted.meta?.changes || 0) !== proof.count ||
      Number(marked.meta?.changes || 0) !== 1
    ) {
      throw new Error("Verified roster deletion failed.");
    }

    return jsonResponse({ ok: true, purged: true, alreadyPurged: false, removedCount: proof.count });
  } catch {
    return jsonResponse(
      { ok: false, code: "TEMPORARILY_UNAVAILABLE", message: "Roster custody could not be confirmed yet." },
      503
    );
  }
}

export function onRequest() {
  return methodNotAllowed("POST");
}
