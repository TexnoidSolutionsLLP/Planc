export type CsvValue = string | number | boolean | Date | null | undefined;

/**
 * Builds a CSV that opens cleanly in Excel, Google Sheets and Numbers:
 * every field quoted, CRLF line endings, and a UTF-8 byte-order mark so ₹ and
 * non-Latin names survive. Text starting with = + - @ (or a tab/CR) is
 * prefixed with ' so a customer-supplied name can't run as a spreadsheet
 * formula (CSV injection).
 */
export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(formatCell).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}

function formatCell(value: CsvValue): string {
  let text: string;
  if (value == null) text = "";
  else if (value instanceof Date) text = value.toISOString();
  else if (typeof value === "number" || typeof value === "boolean") text = String(value);
  else text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${text.replace(/"/g, '""')}"`;
}
