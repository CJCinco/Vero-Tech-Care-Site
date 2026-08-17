const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const COOKIE_NAME = "__Host-vtc-workshop-kiosk";
export const SESSION_SECONDS = 12 * 60 * 60;
export const DISCLOSURE_VERSION = "2026-08-17-v1";
export const CONSENT_TEXT =
  "Email is optional. If you share it, Vero Tech Care may send workshop follow-up and occasional tech tips. You can unsubscribe anytime.";

const API_HEADERS = Object.freeze({
  "Cache-Control": "no-store, max-age=0",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex, nofollow, noarchive"
});

export function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...API_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders
    }
  });
}

export function methodNotAllowed(allowed) {
  return jsonResponse(
    { ok: false, code: "METHOD_NOT_ALLOWED", message: "That action is not available." },
    405,
    { Allow: allowed }
  );
}

export function ensureConfigured(env, names) {
  return names.every((name) => typeof env?.[name] === "string" && env[name].length >= 24);
}

export function isSameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function hasJsonContentType(request) {
  return (request.headers.get("Content-Type") || "")
    .toLowerCase()
    .startsWith("application/json");
}

export async function readJsonBody(request, maximumBytes = 4096) {
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > maximumBytes) throw new InputError("REQUEST_TOO_LARGE");

  const text = await request.text();
  if (encoder.encode(text).byteLength > maximumBytes) throw new InputError("REQUEST_TOO_LARGE");

  try {
    return JSON.parse(text);
  } catch {
    throw new InputError("INVALID_JSON");
  }
}

export class InputError extends Error {
  constructor(code, field = "") {
    super(code);
    this.name = "InputError";
    this.code = code;
    this.field = field;
  }
}

function normalizedText(value, field, maximumLength, { required = false } = {}) {
  if (typeof value !== "string") {
    if (!required && (value === null || value === undefined)) return "";
    throw new InputError("INVALID_FIELD", field);
  }

  const canonical = value.normalize("NFKC");
  if (/[\u0000-\u001F\u007F]/.test(canonical)) {
    throw new InputError("INVALID_FIELD", field);
  }
  const normalized = canonical.replace(/\s+/g, " ").trim();

  if (required && normalized.length < 1) throw new InputError("REQUIRED_FIELD", field);
  if (normalized.length > maximumLength) throw new InputError("FIELD_TOO_LONG", field);
  return normalized;
}

export function validateEventInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InputError("INVALID_EVENT");
  }

  const id = normalizedText(value.id, "eventId", 80, { required: true }).toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{2,79}$/.test(id)) {
    throw new InputError("INVALID_FIELD", "eventId");
  }

  return {
    id,
    title: normalizedText(value.title, "eventTitle", 140, { required: true }),
    details: normalizedText(value.details, "eventDetails", 220)
  };
}

export function validateSubmission(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InputError("INVALID_SUBMISSION");
  }

  const clientSubmissionId = normalizedText(value.clientSubmissionId, "submission", 64, {
    required: true
  }).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(clientSubmissionId)) {
    throw new InputError("INVALID_FIELD", "submission");
  }

  const fullName = normalizedText(value.fullName, "fullName", 120, { required: true });
  const email = normalizedText(value.email, "email", 254).toLowerCase();
  const phone = normalizedText(value.phone, "phone", 40);

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new InputError("INVALID_FIELD", "email");
  }

  return {
    clientSubmissionId,
    fullName,
    email,
    phone,
    emailProvidedUnderDisclosure: email ? 1 : 0
  };
}

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export function secureEqual(left, right) {
  const leftBytes = encoder.encode(String(left));
  const rightBytes = encoder.encode(String(right));
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0);
  }

  return difference === 0;
}

export async function createSessionToken(
  eventId,
  sessionGeneration,
  secret,
  nowSeconds = Math.floor(Date.now() / 1000)
) {
  const payload = {
    version: 1,
    eventId,
    sessionGeneration,
    sessionId: crypto.randomUUID(),
    issuedAt: nowSeconds,
    expiresAt: nowSeconds + SESSION_SECONDS
  };
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = toBase64Url(await hmac(encodedPayload, secret));
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (typeof token !== "string") return null;
  const [encodedPayload, suppliedSignature, extra] = token.split(".");
  if (!encodedPayload || !suppliedSignature || extra) return null;

  try {
    const expectedSignature = toBase64Url(await hmac(encodedPayload, secret));
    if (!secureEqual(suppliedSignature, expectedSignature)) return null;

    const payload = JSON.parse(decoder.decode(fromBase64Url(encodedPayload)));
    if (
      payload?.version !== 1 ||
      typeof payload.eventId !== "string" ||
      typeof payload.sessionGeneration !== "string" ||
      typeof payload.sessionId !== "string" ||
      !Number.isInteger(payload.expiresAt) ||
      payload.expiresAt <= nowSeconds
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function readCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) {
      try {
        return decodeURIComponent(rawValue.join("="));
      } catch {
        return "";
      }
    }
  }
  return "";
}

export function sessionCookie(token) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${SESSION_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

export async function requireOpenEvent(request, env) {
  if (!ensureConfigured(env, ["CHECKIN_SESSION_KEY"]) || !env?.CHECKINS_DB) return null;
  const token = readCookie(request, COOKIE_NAME);
  const session = await verifySessionToken(token, env.CHECKIN_SESSION_KEY);
  if (!session) return null;

  const event = await env.CHECKINS_DB.prepare(
    "SELECT id, title, details, status, session_generation FROM events WHERE id = ? LIMIT 1"
  )
    .bind(session.eventId)
    .first();

  if (
    !event ||
    event.status !== "open" ||
    !secureEqual(session.sessionGeneration, event.session_generation)
  ) {
    return null;
  }
  return { session, event };
}

export function publicEvent(event) {
  return {
    id: event.id,
    title: event.title,
    details: event.details,
    status: event.status
  };
}

export async function receiptDigest(receiptIds) {
  const canonical = [...receiptIds].sort().join("\n");
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(canonical))
  );
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function loadRosterProof(database, eventId) {
  const query = await database
    .prepare(
      `SELECT sequence, receipt_id
       FROM checkins
       WHERE event_id = ?
       ORDER BY sequence ASC
       LIMIT 5001`
    )
    .bind(eventId)
    .all();
  const rows = query.results || [];
  if (rows.length > 5000) throw new Error("Roster proof limit exceeded.");

  return {
    count: rows.length,
    finalSequence: rows.length ? Number(rows[rows.length - 1].sequence) : 0,
    digest: await receiptDigest(rows.map((row) => row.receipt_id))
  };
}

export function errorPayload(error) {
  if (error instanceof InputError) {
    return jsonResponse(
      {
        ok: false,
        code: error.code,
        field: error.field,
        message: "Please review the highlighted information and try again."
      },
      400
    );
  }

  return jsonResponse(
    {
      ok: false,
      code: "TEMPORARILY_UNAVAILABLE",
      message: "Your check-in was not confirmed. Please keep this screen open and try again."
    },
    503
  );
}
