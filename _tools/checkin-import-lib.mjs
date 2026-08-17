import path from "node:path";

export function isPathInside(allowedRoot, destination) {
  const relative = path.relative(allowedRoot, destination);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

export function safeCsvCell(value) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function csvLine(values) {
  return values.map(safeCsvCell).join(",");
}

function parseCsvLine(line) {
  const values = [];
  let index = 0;

  while (index < line.length) {
    if (line[index] !== '"') throw new Error("The existing check-in CSV is not in the protected format.");
    index += 1;
    let value = "";
    let closed = false;

    while (index < line.length) {
      if (line[index] !== '"') {
        value += line[index];
        index += 1;
        continue;
      }
      if (line[index + 1] === '"') {
        value += '"';
        index += 2;
        continue;
      }
      index += 1;
      closed = true;
      break;
    }

    if (!closed) throw new Error("The existing check-in CSV has an unfinished quoted value.");
    values.push(value);
    if (index === line.length) break;
    if (line[index] !== ",") throw new Error("The existing check-in CSV has unexpected content.");
    index += 1;
    if (index === line.length) throw new Error("The existing check-in CSV has an empty trailing column.");
  }

  return values;
}

export function mergeCsvSnapshot(existingCsv, columns, incomingRows) {
  const expectedHeader = csvLine(columns);
  const existingLines = existingCsv
    ? existingCsv.replace(/\r\n/g, "\n").trimEnd().split("\n")
    : [];

  if (existingLines.length && existingLines[0] !== expectedHeader) {
    throw new Error("The existing check-in CSV header does not match the current protected format.");
  }

  const orderedLines = [];
  const linesByReceipt = new Map();
  for (const line of existingLines.slice(1)) {
    const values = parseCsvLine(line);
    if (values.length !== columns.length) {
      throw new Error("The existing check-in CSV has an unexpected number of columns.");
    }
    const receiptId = values[0];
    if (!/^[0-9a-f-]{36}$/i.test(receiptId) || linesByReceipt.has(receiptId)) {
      throw new Error("The existing check-in CSV has an invalid or duplicate receipt.");
    }
    const canonicalLine = csvLine(values);
    orderedLines.push(canonicalLine);
    linesByReceipt.set(receiptId, canonicalLine);
  }

  let addedCount = 0;
  for (const values of incomingRows) {
    if (!Array.isArray(values) || values.length !== columns.length) {
      throw new Error("The remote check-in snapshot has an unexpected number of columns.");
    }
    const receiptId = String(values[0] || "");
    if (!/^[0-9a-f-]{36}$/i.test(receiptId)) {
      throw new Error("The remote check-in snapshot has an invalid receipt.");
    }
    const canonicalLine = csvLine(values);
    const existingLine = linesByReceipt.get(receiptId);
    if (existingLine && existingLine !== canonicalLine) {
      throw new Error("A previously preserved check-in no longer matches the remote record.");
    }
    if (!existingLine) {
      orderedLines.push(canonicalLine);
      linesByReceipt.set(receiptId, canonicalLine);
      addedCount += 1;
    }
  }

  return {
    csv: `${[expectedHeader, ...orderedLines].join("\n")}\n`,
    totalCount: orderedLines.length,
    previousCount: existingLines.length ? existingLines.length - 1 : 0,
    addedCount
  };
}
