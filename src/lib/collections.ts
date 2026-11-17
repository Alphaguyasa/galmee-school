import { parseGregorian, toEthiopian, toGregorian, type GregorianDate } from "@/lib/ethiopian-date";

export const COLLECTION_RANGES = ["today", "month"] as const;
export type CollectionRange = (typeof COLLECTION_RANGES)[number];

const ADDIS_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Midnight in Addis Ababa on a Gregorian day, as an instant. */
function addisMidnight({ year, month, day }: GregorianDate): Date {
  return new Date(Date.UTC(year, month - 1, day) - ADDIS_OFFSET_MS);
}

/**
 * Start and end instants of "today" or "this Ethiopian month" in Addis Ababa time.
 * `to` is exclusive (the next midnight / the first day of the next Ethiopian month).
 */
export function collectionWindow(range: CollectionRange, now: Date = new Date()): { from: Date; to: Date } {
  const today = parseGregorian(now);
  if (range === "today") {
    const from = addisMidnight(today);
    return { from, to: new Date(from.getTime() + 24 * 60 * 60 * 1000) };
  }
  const et = toEthiopian(today);
  const from = addisMidnight(toGregorian({ year: et.year, month: et.month, day: 1 }));
  const next = et.month === 13 ? { year: et.year + 1, month: 1 } : { year: et.year, month: et.month + 1 };
  return { from, to: addisMidnight(toGregorian({ ...next, day: 1 })) };
}

/** One CSV cell: quoted, quotes doubled, and a leading = + - @ neutralised so spreadsheets never run it. */
export function csvCell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** CSV text with a BOM so Excel opens Amharic correctly; rows end in CRLF. */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
