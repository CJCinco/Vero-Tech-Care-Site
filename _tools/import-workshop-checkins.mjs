import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  lstat,
  open,
  readFile,
  realpath,
  rename,
  unlink
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isPathInside, mergeCsvSnapshot } from "./checkin-import-lib.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(repoRoot, ".vtc-checkin-import.json");
const eventArgumentIndex = process.argv.indexOf("--event");
const eventId = eventArgumentIndex >= 0 ? process.argv[eventArgumentIndex + 1] : "";
const purgeRequested = process.argv.includes("--purge-eligible");

const columns = [
  "Receipt ID",
  "Checked In At",
  "Full Name",
  "Email",
  "Phone",
  "Email Provided Under Disclosure",
  "Disclosure Version",
  "Event ID",
  "Workshop",
  "Event Details"
];

if (!/^[a-z0-9][a-z0-9-]{2,79}$/.test(eventId || "")) {
  throw new Error("Provide one known workshop with --event <workshop-code>.");
}

const config = JSON.parse(await readFile(configPath, "utf8"));
const eventConfig = config.events?.[eventId];
if (!eventConfig) throw new Error("That workshop is not in the local import allowlist.");

const baseUrl = new URL(config.baseUrl);
if (baseUrl.protocol !== "https:" && baseUrl.hostname !== "127.0.0.1" && baseUrl.hostname !== "localhost") {
  throw new Error("The export source must use HTTPS.");
}

const providedDestinationMetadata = await lstat(eventConfig.destinationDirectory);
if (!providedDestinationMetadata.isDirectory() || providedDestinationMetadata.isSymbolicLink()) {
  throw new Error("The approved destination must be a real directory, not a link.");
}

const allowedRoot = await realpath(config.allowedRoot);
const destinationDirectory = await realpath(eventConfig.destinationDirectory);
if (!isPathInside(allowedRoot, destinationDirectory)) {
  throw new Error("The destination is outside the approved Workshops folder.");
}

const destinationMetadata = await lstat(destinationDirectory);
if (!destinationMetadata.isDirectory() || destinationMetadata.isSymbolicLink()) {
  throw new Error("The approved destination must be a real directory, not a link.");
}

const fileName = eventConfig.fileName;
if (typeof fileName !== "string" || !/^[A-Za-z0-9 ._()-]+\.csv$/.test(fileName)) {
  throw new Error("The approved output filename is not valid.");
}

const destinationPath = path.join(destinationDirectory, fileName);
let existingCsv = "";
try {
  const existingMetadata = await lstat(destinationPath);
  if (!existingMetadata.isFile() || existingMetadata.isSymbolicLink()) {
    throw new Error("The approved output is not a regular file.");
  }
  existingCsv = await readFile(destinationPath, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

function keychainCredential(account) {
  return execFileSync(
    "security",
    ["find-generic-password", "-w", "-s", "VTC Workshop Check-In", "-a", account],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
  ).trim();
}

const exportToken = keychainCredential("export-token");
const adminToken = keychainCredential("admin-token");
if (exportToken.length < 24) throw new Error("The workshop export credential is unavailable.");
if (adminToken.length < 24) throw new Error("The workshop archive credential is unavailable.");

let after = 0;
let event = null;
let expectedTotalCount = null;
let expectedFinalSequence = null;
let exhausted = false;
const rows = [];
const receiptIds = new Set();

for (let page = 0; page < 100; page += 1) {
  const exportUrl = new URL("/api/workshop-check-in/export", baseUrl);
  exportUrl.searchParams.set("event", eventId);
  exportUrl.searchParams.set("after", String(after));
  exportUrl.searchParams.set("limit", "500");

  const response = await fetch(exportUrl, {
    headers: { Authorization: `Bearer ${exportToken}` },
    cache: "no-store"
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok || !Array.isArray(payload.rows)) {
    throw new Error("The protected workshop export was not confirmed.");
  }
  if (payload.event?.id !== eventId) throw new Error("The export returned the wrong workshop.");
  if (payload.event.status !== "closed") {
    throw new Error("Close the workshop before importing its final check-in roster.");
  }
  if (
    !Number.isInteger(payload.totalCount) ||
    payload.totalCount < 0 ||
    !Number.isInteger(payload.finalSequence) ||
    payload.finalSequence < 0
  ) {
    throw new Error("The export did not provide a valid frozen roster snapshot.");
  }

  event ||= payload.event;
  expectedTotalCount ??= payload.totalCount;
  expectedFinalSequence ??= payload.finalSequence;
  if (
    payload.totalCount !== expectedTotalCount ||
    payload.finalSequence !== expectedFinalSequence
  ) {
    throw new Error("The remote roster changed during export; no local file was replaced.");
  }
  for (const row of payload.rows) {
    if (
      row.eventId !== eventId ||
      typeof row.receiptId !== "string" ||
      !Number.isInteger(row.sequence) ||
      row.sequence < 1 ||
      row.sequence > expectedFinalSequence ||
      receiptIds.has(row.receiptId)
    ) {
      throw new Error("The export contains an invalid or duplicate receipt.");
    }
    receiptIds.add(row.receiptId);
    rows.push(row);
  }

  if (!payload.hasMore) {
    exhausted = true;
    break;
  }
  if (!Number.isInteger(payload.nextCursor) || payload.nextCursor <= after) {
    throw new Error("The export cursor did not advance safely.");
  }
  after = payload.nextCursor;
}

if (!event) throw new Error("The export did not identify the workshop.");
if (!exhausted) throw new Error("The export pagination limit was reached before the roster was complete.");
if (rows.length !== expectedTotalCount) {
  throw new Error("The export row count did not match the frozen roster snapshot.");
}
if (
  expectedTotalCount > 0 &&
  rows[rows.length - 1]?.sequence !== expectedFinalSequence
) {
  throw new Error("The export did not reach the frozen final roster sequence.");
}

const incomingRows = rows.map((row) =>
  [
      row.receiptId,
      row.checkedInAt,
      row.fullName,
      row.email,
      row.phone,
      row.emailProvidedUnderDisclosure ? "yes" : "no",
      row.disclosureVersion,
      eventId,
      event.title,
      event.details
  ]
);
const merged = mergeCsvSnapshot(existingCsv, columns, incomingRows);
const csv = merged.csv;
const remoteReceiptDigest = createHash("sha256")
  .update([...receiptIds].sort().join("\n"))
  .digest("hex");
const temporaryPath = `${destinationPath}.tmp-${process.pid}-${randomUUID()}`;
let temporaryHandle = null;

try {
  temporaryHandle = await open(temporaryPath, "wx", 0o600);
  await temporaryHandle.writeFile(csv, "utf8");
  await temporaryHandle.sync();
  await temporaryHandle.close();
  temporaryHandle = null;

  const temporaryReadback = await readFile(temporaryPath, "utf8");
  const readbackLines = temporaryReadback.trimEnd().split("\n");
  if (readbackLines.length !== merged.totalCount + 1) {
    throw new Error("The generated CSV row count did not match the export.");
  }
  for (const receiptId of receiptIds) {
    if (!temporaryReadback.includes(`"${receiptId}"`)) {
      throw new Error("The generated CSV did not preserve every receipt.");
    }
  }

  await rename(temporaryPath, destinationPath);
  const finalReadback = await readFile(destinationPath, "utf8");
  if (finalReadback !== csv) throw new Error("The final CSV readback did not match the verified output.");

  const sha256 = createHash("sha256").update(finalReadback).digest("hex");

  let custodyVerified = false;
  if (merged.totalCount === rows.length) {
    const archiveUrl = new URL("/api/workshop-check-in/archive", baseUrl);
    const archiveResponse = await fetch(archiveUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "verify",
        eventId,
        receiptCount: rows.length,
        finalSequence: expectedFinalSequence,
        receiptDigest: remoteReceiptDigest
      }),
      signal: AbortSignal.timeout(15000)
    });
    const archivePayload = await archiveResponse.json().catch(() => null);
    if (!archiveResponse.ok || !archivePayload?.ok || !archivePayload.verified) {
      throw new Error("The remote roster did not acknowledge the verified AOS copy.");
    }
    custodyVerified = true;
  }

  let purgeStatus = "not requested";
  if (purgeRequested) {
    const purgeUrl = new URL("/api/workshop-check-in/archive", baseUrl);
    const purgeResponse = await fetch(purgeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action: "purge", eventId }),
      signal: AbortSignal.timeout(15000)
    });
    const purgePayload = await purgeResponse.json().catch(() => null);
    if (purgeResponse.status === 409 && purgePayload?.code === "RETENTION_NOT_COMPLETE") {
      purgeStatus = "not yet eligible";
    } else if (!purgeResponse.ok || !purgePayload?.ok || !purgePayload.purged) {
      throw new Error("The protected remote-roster deletion was not confirmed.");
    } else {
      purgeStatus = purgePayload.alreadyPurged
        ? "already removed after prior custody proof"
        : `removed ${purgePayload.removedCount} remote row${purgePayload.removedCount === 1 ? "" : "s"}`;
    }
  }

  console.log(`Preserved ${merged.previousCount} prior verified check-in${merged.previousCount === 1 ? "" : "s"}.`);
  console.log(`Added ${merged.addedCount} new verified check-in${merged.addedCount === 1 ? "" : "s"}.`);
  console.log(`Roster total: ${merged.totalCount}.`);
  console.log(`AOS custody acknowledgement: ${custodyVerified ? "verified" : "preserved from the prior roster"}.`);
  if (purgeRequested) console.log(`Remote retention cleanup: ${purgeStatus}.`);
  console.log(`Workshop: ${eventId}`);
  console.log(`Output: ${destinationPath}`);
  console.log(`SHA-256: ${sha256}`);
} catch (error) {
  if (temporaryHandle) await temporaryHandle.close().catch(() => {});
  await unlink(temporaryPath).catch(() => {});
  throw error;
}
