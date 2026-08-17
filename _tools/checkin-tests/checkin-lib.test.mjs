import assert from "node:assert/strict";
import test from "node:test";

import {
  COOKIE_NAME,
  CONSENT_TEXT,
  InputError,
  clearSessionCookie,
  createSessionToken,
  receiptDigest,
  secureEqual,
  sessionCookie,
  validateEventInput,
  validateSubmission,
  verifySessionToken
} from "../../functions/_lib/checkin.js";

const secret = "unit-test-session-secret-that-is-long-enough";

test("session tokens bind one event and expire", async () => {
  const token = await createSessionToken("workshop-one", "generation-one", secret, 1000);
  const session = await verifySessionToken(token, secret, 1100);

  assert.equal(session.eventId, "workshop-one");
  assert.equal(await verifySessionToken(token, `${secret}-wrong`, 1100), null);
  assert.equal(await verifySessionToken(token, secret, 1000 + 12 * 60 * 60), null);
});

test("kiosk cookie uses the host-only secure contract", () => {
  assert.match(COOKIE_NAME, /^__Host-/);
  assert.match(sessionCookie("token"), /Path=\/;/);
  assert.match(sessionCookie("token"), /HttpOnly/);
  assert.match(sessionCookie("token"), /Secure/);
  assert.match(sessionCookie("token"), /SameSite=Strict/);
  assert.match(clearSessionCookie(), /Max-Age=0/);
});

test("submission validation keeps the minimum fields and exact disclosure", () => {
  const submission = validateSubmission({
    clientSubmissionId: "79f47d5d-f009-46fa-a7b4-260ae424e26d",
    fullName: "  José O’Neil  ",
    email: " CJ@Example.com ",
    phone: "(772) 555-0100"
  });

  assert.equal(submission.fullName, "José O’Neil");
  assert.equal(submission.email, "cj@example.com");
  assert.equal(submission.emailProvidedUnderDisclosure, 1);
  assert.equal(
    CONSENT_TEXT,
    "Email is optional. If you share it, Vero Tech Care may send workshop follow-up and occasional tech tips. You can unsubscribe anytime."
  );
});

test("submission validation rejects malformed and control-character input", () => {
  assert.throws(
    () =>
      validateSubmission({
        clientSubmissionId: "not-a-uuid",
        fullName: "CJ",
        email: "",
        phone: ""
      }),
    InputError
  );
  assert.throws(
    () =>
      validateSubmission({
        clientSubmissionId: "79f47d5d-f009-46fa-a7b4-260ae424e26d",
        fullName: "Bad\nName",
        email: "",
        phone: ""
      }),
    InputError
  );
  assert.throws(
    () =>
      validateSubmission({
        clientSubmissionId: "79f47d5d-f009-46fa-a7b4-260ae424e26d",
        fullName: "CJ",
        email: "not-an-email",
        phone: ""
      }),
    InputError
  );
});

test("event setup accepts only safe event codes", () => {
  assert.deepEqual(
    validateEventInput({ id: "workshop-2026-08-30", title: "Workshop", details: "Vero Beach" }),
    { id: "workshop-2026-08-30", title: "Workshop", details: "Vero Beach" }
  );
  assert.throws(
    () => validateEventInput({ id: "../../private", title: "Workshop", details: "" }),
    InputError
  );
});

test("constant comparison handles equal and unequal values", () => {
  assert.equal(secureEqual("same-value", "same-value"), true);
  assert.equal(secureEqual("same-value", "different-value"), false);
  assert.equal(secureEqual("short", "shorter"), false);
});

test("roster receipt proof is stable regardless of export order", async () => {
  const first = "79f47d5d-f009-46fa-a7b4-260ae424e26d";
  const second = "4f0dd125-a475-4f00-a89d-6cd475b6a512";
  assert.equal(await receiptDigest([first, second]), await receiptDigest([second, first]));
  assert.match(await receiptDigest([]), /^[0-9a-f]{64}$/);
});
