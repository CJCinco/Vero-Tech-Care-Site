import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";

const baseUrl = process.env.CHECKIN_BASE_URL;
const setupPassword = process.env.CHECKIN_SETUP_PASSWORD;
const adminToken = process.env.CHECKIN_ADMIN_TOKEN;
const exportToken = process.env.CHECKIN_EXPORT_TOKEN;
const integrationReady = Boolean(baseUrl && setupPassword && adminToken && exportToken);

async function jsonFetch(pathname, options = {}) {
  const response = await fetch(new URL(pathname, baseUrl), options);
  const body = await response.json().catch(() => null);
  return { response, body };
}

test("live Pages Function and D1 check-in contract", { skip: !integrationReady }, async () => {
  const origin = new URL(baseUrl).origin;
  const runId = Date.now();
  const eventId = `vtc-system-test-${runId}-2026-08-18`;
  const event = {
    title: `VTC System Test ${runId}`,
    details: "August 18, 2026 · Fake data only"
  };
  const jsonHeaders = { "Content-Type": "application/json", Origin: origin };

  const unauthorized = await jsonFetch("/api/workshop-check-in/status");
  assert.equal(unauthorized.response.status, 401);
  assert.equal(unauthorized.body.code, "KIOSK_INACTIVE");

  const wrongOrigin = await jsonFetch("/api/workshop-check-in/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://example.com" },
    body: JSON.stringify({ action: "open", setupPassword, event })
  });
  assert.equal(wrongOrigin.response.status, 403);

  const activation = await jsonFetch("/api/workshop-check-in/activate", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ action: "open", setupPassword, event })
  });
  assert.equal(activation.response.status, 200);
  assert.equal(activation.body.event.id, eventId);
  assert.match(activation.response.headers.get("cache-control") || "", /no-store/);
  const cookie = activation.response.headers.get("set-cookie");
  assert.match(cookie, /__Host-vtc-workshop-kiosk=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);

  const activeStatus = await jsonFetch("/api/workshop-check-in/status", {
    headers: { Cookie: cookie }
  });
  assert.equal(activeStatus.response.status, 200);
  assert.equal(activeStatus.body.event.id, eventId);

  const firstSubmissionId = randomUUID();
  const firstPayload = {
    clientSubmissionId: firstSubmissionId,
    fullName: "VTC System Test",
    email: "test@example.com",
    phone: "(772) 555-0100"
  };
  const first = await jsonFetch("/api/workshop-check-in/submit", {
    method: "POST",
    headers: { ...jsonHeaders, Cookie: cookie },
    body: JSON.stringify(firstPayload)
  });
  assert.equal(first.response.status, 201);
  assert.equal(first.body.saved, true);

  const duplicate = await jsonFetch("/api/workshop-check-in/submit", {
    method: "POST",
    headers: { ...jsonHeaders, Cookie: cookie },
    body: JSON.stringify(firstPayload)
  });
  assert.equal(duplicate.response.status, 200);
  assert.equal(duplicate.body.receiptId, first.body.receiptId);
  assert.equal(duplicate.body.duplicate, true);

  const mismatchedDuplicate = await jsonFetch("/api/workshop-check-in/submit", {
    method: "POST",
    headers: { ...jsonHeaders, Cookie: cookie },
    body: JSON.stringify({
      ...firstPayload,
      fullName: "Different Fake Attendee"
    })
  });
  assert.equal(mismatchedDuplicate.response.status, 409);
  assert.equal(mismatchedDuplicate.body.code, "SUBMISSION_CONFLICT");
  assert.equal(mismatchedDuplicate.body.saved, false);
  assert.equal("receiptId" in mismatchedDuplicate.body, false);

  const receiptStatus = await jsonFetch(
    `/api/workshop-check-in/status?submission=${encodeURIComponent(firstSubmissionId)}`,
    { headers: { Cookie: cookie } }
  );
  assert.equal(receiptStatus.body.saved, true);
  assert.equal(receiptStatus.body.receiptId, first.body.receiptId);

  const sequentialReceipts = new Set([first.body.receiptId]);
  for (let index = 1; index <= 50; index += 1) {
    const result = await jsonFetch("/api/workshop-check-in/submit", {
      method: "POST",
      headers: { ...jsonHeaders, Cookie: cookie },
      body: JSON.stringify({
        clientSubmissionId: randomUUID(),
        fullName: `Fake Attendee ${index}`,
        email: "",
        phone: ""
      })
    });
    assert.equal(result.response.status, 201);
    sequentialReceipts.add(result.body.receiptId);
  }
  assert.equal(sequentialReceipts.size, 51);

  const deniedExport = await jsonFetch(
    `/api/workshop-check-in/export?event=${encodeURIComponent(eventId)}`
  );
  assert.equal(deniedExport.response.status, 403);

  const setupPasswordDeniedExport = await jsonFetch(
    `/api/workshop-check-in/export?event=${encodeURIComponent(eventId)}`,
    { headers: { Authorization: `Bearer ${setupPassword}` } }
  );
  assert.equal(setupPasswordDeniedExport.response.status, 403);

  const setupPasswordDeniedArchive = await jsonFetch("/api/workshop-check-in/archive", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${setupPassword}`
    },
    body: JSON.stringify({ action: "verify", eventId })
  });
  assert.equal(setupPasswordDeniedArchive.response.status, 403);

  const closed = await jsonFetch("/api/workshop-check-in/activate", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ action: "close", setupPassword, event })
  });
  assert.equal(closed.response.status, 200);

  const exported = await jsonFetch(
    `/api/workshop-check-in/export?event=${encodeURIComponent(eventId)}&limit=100`,
    { headers: { Authorization: `Bearer ${exportToken}` } }
  );
  assert.equal(exported.response.status, 200);
  assert.equal(exported.body.rows.length, 51);
  assert.equal(exported.body.totalCount, 51);
  assert.equal(exported.body.rows.at(-1).sequence, exported.body.finalSequence);
  assert.equal(new Set(exported.body.rows.map((row) => row.receiptId)).size, 51);

  const receiptDigest = createHash("sha256")
    .update(exported.body.rows.map((row) => row.receiptId).sort().join("\n"))
    .digest("hex");
  const archived = await jsonFetch("/api/workshop-check-in/archive", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      action: "verify",
      eventId,
      receiptCount: exported.body.totalCount,
      finalSequence: exported.body.finalSequence,
      receiptDigest
    })
  });
  assert.equal(archived.response.status, 200);
  assert.equal(archived.body.verified, true);

  const earlyPurge = await jsonFetch("/api/workshop-check-in/archive", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ action: "purge", eventId })
  });
  assert.equal(earlyPurge.response.status, 409);
  assert.equal(earlyPurge.body.code, "RETENTION_NOT_COMPLETE");

  const reopened = await jsonFetch("/api/workshop-check-in/activate", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ action: "open", setupPassword, event })
  });
  assert.equal(reopened.response.status, 200);
  const newCookie = reopened.response.headers.get("set-cookie");

  const oldSessionAfterReopen = await jsonFetch("/api/workshop-check-in/status", {
    headers: { Cookie: cookie }
  });
  assert.equal(oldSessionAfterReopen.response.status, 401);

  const newSessionAfterReopen = await jsonFetch("/api/workshop-check-in/status", {
    headers: { Cookie: newCookie }
  });
  assert.equal(newSessionAfterReopen.response.status, 200);

  const reclosed = await jsonFetch("/api/workshop-check-in/activate", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ action: "close", setupPassword, event })
  });
  assert.equal(reclosed.response.status, 200);

  const afterClose = await jsonFetch("/api/workshop-check-in/submit", {
    method: "POST",
    headers: { ...jsonHeaders, Cookie: newCookie },
    body: JSON.stringify({
      clientSubmissionId: randomUUID(),
      fullName: "Should Not Save",
      email: "",
      phone: ""
    })
  });
  assert.equal(afterClose.response.status, 401);
});
