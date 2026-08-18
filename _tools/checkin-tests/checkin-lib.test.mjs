import assert from "node:assert/strict";
import test from "node:test";

import {
  COOKIE_NAME,
  CONSENT_TEXT,
  InputError,
  clearSessionCookie,
  createSessionToken,
  deriveEventId,
  ensureSetupPasswordConfigured,
  receiptDigest,
  secureEqual,
  sessionCookie,
  validateEventInput,
  validateSubmission,
  verifySessionToken
} from "../../functions/_lib/checkin.js";
import {
  publicWorkshopCatalog,
  resolveWorkshopSelection,
  validateWorkshopCatalog
} from "../../functions/_lib/workshop-catalog.js";
import { onRequestPost as activateWorkshop } from "../../functions/api/workshop-check-in/activate.js";

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

test("event setup derives a stable internal code from the title and written date", () => {
  assert.deepEqual(
    validateEventInput({
      title: "Smartphone Confidence, Part 1: Smartphone Basics",
      details: "August 30, 2026 at 11:30 AM · Unity Spiritual Center"
    }),
    {
      id: "smartphone-confidence-part-1-2026-08-30",
      title: "Smartphone Confidence, Part 1: Smartphone Basics",
      details: "August 30, 2026 at 11:30 AM · Unity Spiritual Center"
    }
  );
  assert.throws(
    () => validateEventInput({ title: "Workshop", details: "Vero Beach" }),
    InputError
  );
  assert.equal(
    deriveEventId("AI for Everyday Life: Part 2", "September 20, 2026 · Vero Beach"),
    "ai-for-everyday-life-2026-09-20"
  );
});

test("the setup catalog exposes only approved public workshop facts", () => {
  const catalog = publicWorkshopCatalog();
  assert.deepEqual(catalog, [
    {
      key: "smartphone-part-1-2026-08-30",
      label: "Aug 30, 2026 · 11:30 AM · Unity Spiritual Center — Smartphone Confidence, Part 1",
      title: "Smartphone Confidence, Part 1: Smartphone Basics",
      details: "August 30, 2026 at 11:30 AM · Unity Spiritual Center"
    }
  ]);

  const serialized = JSON.stringify(catalog);
  assert.doesNotMatch(serialized, /eventId|destination|Sign Up Sheet|CHECKIN_|\/Users\//);
  assert.doesNotMatch(serialized, /"(?:email|phone|fullName|attendees?|receiptId)"\s*:/i);
});

test("workshop selection resolves canonical facts and rejects unapproved input", () => {
  assert.deepEqual(
    resolveWorkshopSelection({ workshopKey: "smartphone-part-1-2026-08-30" }),
    {
      id: "smartphone-confidence-part-1-2026-08-30",
      title: "Smartphone Confidence, Part 1: Smartphone Basics",
      details: "August 30, 2026 at 11:30 AM · Unity Spiritual Center"
    }
  );
  assert.deepEqual(
    resolveWorkshopSelection({
      event: {
        title: "Smartphone Confidence, Part 1: Smartphone Basics",
        details: "August 30, 2026 at 11:30 AM · Unity Spiritual Center"
      }
    }),
    {
      id: "smartphone-confidence-part-1-2026-08-30",
      title: "Smartphone Confidence, Part 1: Smartphone Basics",
      details: "August 30, 2026 at 11:30 AM · Unity Spiritual Center"
    }
  );
  assert.throws(
    () => resolveWorkshopSelection({ workshopKey: "not-approved" }),
    (error) => error instanceof InputError && error.code === "UNKNOWN_WORKSHOP"
  );
  assert.throws(
    () =>
      resolveWorkshopSelection({
        event: { title: "Unapproved Workshop", details: "August 30, 2026" }
      }),
    (error) => error instanceof InputError && error.code === "UNKNOWN_WORKSHOP"
  );
  assert.throws(
    () =>
      resolveWorkshopSelection({
        workshopKey: "smartphone-part-1-2026-08-30",
        event: {
          title: "Smartphone Confidence, Part 1: Smartphone Basics",
          details: "August 30, 2026 at 11:30 AM · Unity Spiritual Center"
        }
      }),
    (error) => error instanceof InputError && error.code === "INVALID_WORKSHOP"
  );
});

test("workshop catalog rejects duplicate keys, labels, and derived event IDs", () => {
  const base = {
    key: "first-workshop-2026-08-30",
    label: "First workshop",
    title: "First Workshop: Basics",
    details: "August 30, 2026 at 11:30 AM · Public Venue",
    publicSource: "workshops.html",
    publicEvidence: ["First Workshop"]
  };
  const expectInvalid = (entries) =>
    assert.throws(
      () => validateWorkshopCatalog(entries),
      (error) => error instanceof InputError && error.code === "INVALID_CATALOG"
    );

  expectInvalid([base, { ...base, label: "Another label" }]);
  expectInvalid([
    base,
    {
      ...base,
      key: "second-workshop-2026-08-31",
      title: "Second Workshop: Basics",
      details: "August 31, 2026 at 11:30 AM · Public Venue"
    }
  ]);
  expectInvalid([
    base,
    {
      ...base,
      key: "first-workshop-advanced-2026-08-30",
      label: "First workshop advanced",
      title: "First Workshop: Advanced"
    }
  ]);
});

test("opening another workshop fails before any write when one is already open", async () => {
  let writeAttempted = false;
  const database = {
    prepare(statement) {
      assert.match(statement, /WHERE status = 'open' AND id <> \?/);
      return {
        bind(eventId) {
          assert.equal(eventId, "smartphone-confidence-part-1-2026-08-30");
          return {
            async first() {
              return {
                id: "another-workshop-2026-08-29",
                title: "Another workshop",
                details: "August 29, 2026 at 10:00 AM · Unity Spiritual Center"
              };
            },
            async run() {
              writeAttempted = true;
              return { success: true };
            }
          };
        }
      };
    }
  };
  const request = new Request("https://verotechcare.com/api/workshop-check-in/activate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://verotechcare.com"
    },
    body: JSON.stringify({
      action: "open",
      setupPassword: "fake-setup-password",
      workshopKey: "smartphone-part-1-2026-08-30"
    })
  });
  const response = await activateWorkshop({
    request,
    env: {
      CHECKINS_DB: database,
      CHECKIN_SETUP_PASSWORD: "fake-setup-password",
      CHECKIN_SESSION_KEY: "fake-session-key-that-is-long-enough"
    }
  });
  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.code, "ANOTHER_WORKSHOP_OPEN");
  assert.match(body.message, /Another workshop/);
  assert.equal(writeAttempted, false);
});

test("closing the wrong workshop cannot clear the actually open workshop session", async () => {
  let writeAttempted = false;
  const database = {
    prepare(statement) {
      assert.match(statement, /WHERE status = 'open' AND id <> \?/);
      return {
        bind() {
          return {
            async first() {
              return {
                id: "actually-open-workshop-2026-08-29",
                title: "Actually open workshop",
                details: "August 29, 2026 at 10:00 AM · Unity Spiritual Center"
              };
            },
            async run() {
              writeAttempted = true;
              return { success: true, meta: { changes: 1 } };
            }
          };
        }
      };
    }
  };
  const request = new Request("https://verotechcare.com/api/workshop-check-in/activate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://verotechcare.com"
    },
    body: JSON.stringify({
      action: "close",
      setupPassword: "fake-setup-password",
      workshopKey: "smartphone-part-1-2026-08-30"
    })
  });
  const response = await activateWorkshop({
    request,
    env: {
      CHECKINS_DB: database,
      CHECKIN_SETUP_PASSWORD: "fake-setup-password",
      CHECKIN_SESSION_KEY: "fake-session-key-that-is-long-enough"
    }
  });
  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.code, "ANOTHER_WORKSHOP_OPEN");
  assert.match(body.message, /Actually open workshop/);
  assert.equal(response.headers.has("set-cookie"), false);
  assert.equal(writeAttempted, false);
});

test("the atomic activation write detects a concurrent workshop open", async () => {
  let prepareCount = 0;
  const database = {
    prepare(statement) {
      prepareCount += 1;
      if (prepareCount === 1) {
        assert.match(statement, /WHERE status = 'open' AND id <> \?/);
        return {
          bind() {
            return { async first() { return null; } };
          }
        };
      }
      if (prepareCount === 2) {
        assert.match(statement, /INSERT INTO events[\s\S]*SELECT \?, \?, \?/);
        assert.match(statement, /WHERE NOT EXISTS \([\s\S]*status = 'open' AND id <> \?/);
        return {
          bind(id, title, details, sessionGeneration, guardId) {
            assert.equal(id, "smartphone-confidence-part-1-2026-08-30");
            assert.equal(guardId, id);
            assert.equal(typeof sessionGeneration, "string");
            return { async run() { return { success: true, meta: { changes: 0 } }; } };
          }
        };
      }
      assert.equal(prepareCount, 3);
      return {
        bind() {
          return {
            async first() {
              return {
                id: "concurrent-workshop-2026-08-29",
                title: "Concurrent workshop",
                details: "August 29, 2026 at 10:00 AM · Unity Spiritual Center"
              };
            }
          };
        }
      };
    }
  };
  const request = new Request("https://verotechcare.com/api/workshop-check-in/activate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://verotechcare.com"
    },
    body: JSON.stringify({
      action: "open",
      setupPassword: "fake-setup-password",
      workshopKey: "smartphone-part-1-2026-08-30"
    })
  });
  const response = await activateWorkshop({
    request,
    env: {
      CHECKINS_DB: database,
      CHECKIN_SETUP_PASSWORD: "fake-setup-password",
      CHECKIN_SESSION_KEY: "fake-session-key-that-is-long-enough"
    }
  });
  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.code, "ANOTHER_WORKSHOP_OPEN");
  assert.match(body.message, /Concurrent workshop/);
  assert.equal(prepareCount, 3);
});

test("the easy setup password remains separate from strong system credentials", () => {
  assert.equal(ensureSetupPasswordConfigured({ CHECKIN_SETUP_PASSWORD: "short" }), false);
  assert.equal(
    ensureSetupPasswordConfigured({ CHECKIN_SETUP_PASSWORD: "simple-pass" }),
    true
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
