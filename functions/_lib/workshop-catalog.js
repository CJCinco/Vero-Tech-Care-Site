import { InputError, validateEventInput } from "./checkin.js";

export function validateWorkshopCatalog(entries) {
  if (!Array.isArray(entries)) throw new InputError("INVALID_CATALOG", "catalog");

  const keys = new Set();
  const labels = new Set();
  const eventIds = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new InputError("INVALID_CATALOG", "catalog");
    }
    const fields = Object.keys(entry).sort().join(",");
    if (fields !== "details,key,label,publicEvidence,publicSource,title") {
      throw new InputError("INVALID_CATALOG", "catalog");
    }
    if (
      typeof entry.key !== "string" ||
      !/^[a-z0-9][a-z0-9-]{2,79}$/.test(entry.key) ||
      typeof entry.label !== "string" ||
      entry.label.length < 1 ||
      entry.label.length > 200 ||
      entry.label !== entry.label.trim() ||
      /[\u0000-\u001F\u007F]/.test(entry.label) ||
      typeof entry.publicSource !== "string" ||
      !/^[a-z0-9][a-z0-9-]*\.html$/.test(entry.publicSource) ||
      !Array.isArray(entry.publicEvidence) ||
      entry.publicEvidence.length < 1 ||
      entry.publicEvidence.some(
        (value) =>
          typeof value !== "string" ||
          value.length < 2 ||
          value.length > 100 ||
          /[\u0000-\u001F\u007F]/.test(value)
      ) ||
      keys.has(entry.key) ||
      labels.has(entry.label)
    ) {
      throw new InputError("INVALID_CATALOG", "catalog");
    }

    const event = validateEventInput({ title: entry.title, details: entry.details });
    if (eventIds.has(event.id)) throw new InputError("INVALID_CATALOG", "catalog");
    keys.add(entry.key);
    labels.add(entry.label);
    eventIds.add(event.id);
  }
  return entries;
}

const WORKSHOPS = Object.freeze(
  validateWorkshopCatalog([
    {
      key: "smartphone-part-1-2026-08-30",
      label:
        "Aug 30, 2026 · 11:30 AM · Unity Spiritual Center — Smartphone Confidence, Part 1",
      title: "Smartphone Confidence, Part 1: Smartphone Basics",
      details: "August 30, 2026 at 11:30 AM · Unity Spiritual Center",
      publicSource: "smartphone-confidence.html",
      publicEvidence: [
        "August 30, 2026",
        "11:30 AM",
        "Unity Spiritual Center",
        "Smartphone Basics"
      ]
    }
  ]).map((entry) =>
    Object.freeze({ ...entry, publicEvidence: Object.freeze([...entry.publicEvidence]) })
  )
);

export function publicWorkshopCatalog() {
  return WORKSHOPS.map(({ key, label, title, details }) => ({
    key,
    label,
    title,
    details
  }));
}

export function workshopCatalogAudit() {
  return WORKSHOPS.map(({ key, title, details, publicSource, publicEvidence }) => ({
    key,
    eventId: validateEventInput({ title, details }).id,
    publicSource,
    publicEvidence: [...publicEvidence]
  }));
}

export function resolveWorkshopSelection(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new InputError("INVALID_WORKSHOP", "workshop");
  }

  let workshop = null;
  if (typeof body.workshopKey === "string" && body.workshopKey) {
    if (body.event !== undefined) throw new InputError("INVALID_WORKSHOP", "workshop");
    workshop = WORKSHOPS.find((candidate) => candidate.key === body.workshopKey) || null;
  } else if (body.event !== undefined) {
    const legacyEvent = validateEventInput(body.event);
    workshop = WORKSHOPS.find(
      (candidate) =>
        candidate.title === legacyEvent.title && candidate.details === legacyEvent.details
    ) || null;
  }

  if (!workshop) throw new InputError("UNKNOWN_WORKSHOP", "workshop");
  return validateEventInput({ title: workshop.title, details: workshop.details });
}
