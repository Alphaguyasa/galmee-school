import { parseGregorian, toEthiopian } from "@/lib/ethiopian-date";

/** School years follow the Ethiopian calendar: the year turns over on Meskerem 1 (about 11 September). */
export function currentSchoolYear(now: Date = new Date()): number {
  return toEthiopian(parseGregorian(now)).year;
}
