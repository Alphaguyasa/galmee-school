import QRCode from "qrcode";

/** What a student's card QR holds: a fixed prefix and the student's id, nothing personal. */
export function studentCardPayload(studentId: string): string {
  return `GALMEE-SC:${studentId}`;
}

/**
 * The QR code as one SVG path in module units (one module = 1 x 1), so it can be drawn
 * inline at any size without injecting markup. `size` excludes the quiet zone.
 */
export function qrPath(text: string): { size: number; d: string } {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const { size } = modules;
  let d = "";
  for (let y = 0; y < size; y++) {
    let x = 0;
    while (x < size) {
      if (!modules.get(y, x)) {
        x++;
        continue;
      }
      const start = x;
      while (x < size && modules.get(y, x)) x++;
      d += `M${start} ${y}h${x - start}v1h-${x - start}z`;
    }
  }
  return { size, d };
}

/** Up to two initials for the photo frame when no photo is on file. */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => Array.from(p)[0] ?? "")
    .join("")
    .toUpperCase();
}

/** Cards per printed A4 sheet: 2 columns x 5 rows of ID-1 (85.6 x 54 mm) cards. */
export const CARDS_PER_SHEET = 10;

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
