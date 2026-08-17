import assert from "node:assert/strict";
import test from "node:test";

import {
  csvLine,
  isPathInside,
  mergeCsvSnapshot,
  safeCsvCell
} from "../checkin-import-lib.mjs";

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
