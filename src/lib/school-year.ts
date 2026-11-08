import { parseGregorian, toEthiopian } from "@/lib/ethiopian-date";

/** School years follow the Ethiopian calendar: the year turns over on Meskerem 1 (about 11 September). */
export function currentSchoolYear(now: Date = new Date()): number {
  return toEthiopian(parseGregorian(now)).year;
}

/** Today in Addis Ababa as `YYYY-MM-DD` (the school's day, not the server's). */
export function addisToday(now: Date = new Date()): string {
  const { year, month, day } = parseGregorian(now);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function shiftDay(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
