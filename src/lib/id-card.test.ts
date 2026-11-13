import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { CARDS_PER_SHEET, chunk, initials, qrPath, studentCardPayload } from "@/lib/id-card";

describe("student ID card helpers", () => {
  it("payload carries only the prefix and the student id", () => {
    expect(studentCardPayload("0b6c0d43-1d3e-4c55-9d1f-2b8f4d0a9e11")).toBe(
      "GALMEE-SC:0b6c0d43-1d3e-4c55-9d1f-2b8f4d0a9e11",
    );
  });

  it("path covers exactly the dark modules of the QR code", () => {
    const text = studentCardPayload("0b6c0d43-1d3e-4c55-9d1f-2b8f4d0a9e11");
    const { size, d } = qrPath(text);
    const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
    expect(size).toBe(modules.size);
    let dark = 0;
    for (let i = 0; i < size * size; i++) if (modules.data[i]) dark++;
    const covered = [...d.matchAll(/h(\d+)v1/g)].reduce((sum, m) => sum + Number(m[1]), 0);
    expect(covered).toBe(dark);
  });

  it("initials work for Ethiopic and Latin names", () => {
    expect(initials("Abebe Kebede Tola")).toBe("AK");
    expect(initials("ሰላም ታደሰ")).toBe("ሰታ");
    expect(initials("  chaltu  ")).toBe("C");
  });

  it("splits a class into A4 sheets of ten", () => {
    const sheets = chunk(Array.from({ length: 23 }, (_, i) => i), CARDS_PER_SHEET);
    expect(sheets.map((s) => s.length)).toEqual([10, 10, 3]);
  });
});
