import assert from "node:assert/strict";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  csvLine,
  isPathInside,
  mergeCsvSnapshot,
  safeCsvCell
} from "../checkin-import-lib.mjs";
import {
  publicWorkshopCatalog,
  resolveWorkshopSelection,
  workshopCatalogAudit
} from "../../functions/_lib/workshop-catalog.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const localImportConfigPath = path.join(repoRoot, ".vtc-checkin-import.json");

test("CSV output quotes values and neutralizes spreadsheet formulas", () => {
  assert.equal(safeCsvCell("CJ Watson"), '"CJ Watson"');
  assert.equal(safeCsvCell('A "quoted" name'), '"A ""quoted"" name"');
  for (const dangerous of ["=2+2", "+SUM(A1:A2)", "-7+3", "@command", "\tformula", "\rformula"]) {
    assert.equal(safeCsvCell(dangerous).startsWith('"\''), true);
  }
});

test("AOS path validation accepts only descendants of the approved root", () => {
  assert.equal(isPathInside("/a/workshops", "/a/workshops/event/6 Sign Up Sheet"), true);
  assert.equal(isPathInside("/a/workshops", "/a/workshops"), false);
  assert.equal(isPathInside("/a/workshops", "/a/private"), false);
  assert.equal(isPathInside("/a/workshops", "/a/workshops-other/event"), false);
});

test("every selectable workshop has a real protected import destination", () => {
  assert.equal(
    existsSync(localImportConfigPath),
    true,
    "The private local import mapping is required before testing or releasing a selectable workshop."
  );
  const config = JSON.parse(readFileSync(localImportConfigPath, "utf8"));
  const allowedRoot = realpathSync(config.allowedRoot);

  for (const workshop of publicWorkshopCatalog()) {
    const event = resolveWorkshopSelection({ workshopKey: workshop.key });
    const eventConfig = config.events && config.events[event.id];
    assert.ok(eventConfig, "Selectable workshop is missing from the local import allowlist.");
    const configuredDestination = lstatSync(eventConfig.destinationDirectory);
    assert.equal(configuredDestination.isSymbolicLink(), false);
    assert.equal(configuredDestination.isDirectory(), true);
    const destination = realpathSync(eventConfig.destinationDirectory);
    assert.equal(isPathInside(allowedRoot, destination), true);
    assert.match(path.basename(destination), /^6 Sign Up Sheet$/);
    assert.match(eventConfig.fileName, /\.csv$/);
  }
});

test("every selectable workshop is backed by approved public source facts", () => {
  for (const workshop of workshopCatalogAudit()) {
    const publicSourcePath = path.join(repoRoot, workshop.publicSource);
    assert.equal(existsSync(publicSourcePath), true, "Catalog public source is missing.");
    const publicSource = readFileSync(publicSourcePath, "utf8");
    for (const evidence of workshop.publicEvidence) {
      assert.ok(
        publicSource.includes(evidence),
        `Catalog fact is not present in ${workshop.publicSource}: ${evidence}`
      );
    }
  }
});

test("AOS merge preserves prior receipts when a later remote snapshot is empty", () => {
  const columns = ["Receipt ID", "Full Name"];
  const first = ["79f47d5d-f009-46fa-a7b4-260ae424e26d", "Fake Attendee"];
  const existing = `${csvLine(columns)}\n${csvLine(first)}\n`;
  const merged = mergeCsvSnapshot(existing, columns, []);

  assert.equal(merged.csv, existing);
  assert.equal(merged.previousCount, 1);
  assert.equal(merged.addedCount, 0);
  assert.equal(merged.totalCount, 1);
});

test("AOS merge adds new receipts once and rejects changed preserved data", () => {
  const columns = ["Receipt ID", "Full Name"];
  const first = ["79f47d5d-f009-46fa-a7b4-260ae424e26d", "Fake Attendee"];
  const second = ["4f0dd125-a475-4f00-a89d-6cd475b6a512", "Second Fake Attendee"];
  const existing = `${csvLine(columns)}\n${csvLine(first)}\n`;
  const merged = mergeCsvSnapshot(existing, columns, [first, second, second]);

  assert.equal(merged.totalCount, 2);
  assert.equal(merged.addedCount, 1);
  assert.throws(
    () => mergeCsvSnapshot(existing, columns, [[first[0], "Changed Name"]]),
    /no longer matches/
  );
});
