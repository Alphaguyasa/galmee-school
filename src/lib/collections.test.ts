import { describe, expect, it } from "vitest";
import { collectionWindow, csvCell, toCsv } from "./collections";

describe("collectionWindow", () => {
  it("uses Addis Ababa midnight for today", () => {
    // 22:30 UTC on 17 Nov is already 18 Nov in Addis Ababa.
    const { from, to } = collectionWindow("today", new Date("2026-11-17T22:30:00Z"));
    expect(from.toISOString()).toBe("2026-11-17T21:00:00.000Z");
    expect(to.toISOString()).toBe("2026-11-18T21:00:00.000Z");
  });
  it("covers the whole Ethiopian month", () => {
    // 17 Nov 2026 is Hidar 8, 2019; Hidar 1 is 10 Nov and Tahsas 1 is 10 Dec.
    const { from, to } = collectionWindow("month", new Date("2026-11-17T09:00:00Z"));
    expect(from.toISOString()).toBe("2026-11-09T21:00:00.000Z");
    expect(to.toISOString()).toBe("2026-12-09T21:00:00.000Z");
  });
  it("rolls from Pagume into the new year", () => {
    // 8 Sep 2026 is Pagume 3, 2018; Meskerem 1, 2019 is 11 Sep 2026.
    const { from, to } = collectionWindow("month", new Date("2026-09-08T09:00:00Z"));
    expect(from.toISOString()).toBe("2026-09-05T21:00:00.000Z");
    expect(to.toISOString()).toBe("2026-09-10T21:00:00.000Z");
  });
});

describe("csv", () => {
  it("quotes, doubles quotes and keeps Ethiopic", () => {
    expect(csvCell('Say "hi"')).toBe('"Say ""hi"""');
    expect(csvCell("ቦንቱ ኃይሉ")).toBe('"ቦንቱ ኃይሉ"');
    expect(csvCell(1500.5)).toBe('"1500.5"');
    expect(csvCell(null)).toBe('""');
  });
  it("neutralises spreadsheet formulas in text", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe(`"'=HYPERLINK(1)"`);
    expect(csvCell("-5")).toBe(`"'-5"`);
    expect(csvCell(-5)).toBe('"-5"');
  });
  it("starts with a BOM and ends rows with CRLF", () => {
    expect(toCsv([["a", 1]])).toBe('﻿"a","1"\r\n');
  });
});
