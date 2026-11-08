import type { Locale } from "@/i18n/config";
import { ETHIOPIAN_MONTHS, parseGregorian, toEthiopian } from "@/lib/ethiopian-date";

export type PeriodType = "monthly" | "term" | "annual";

/** Fee period of the current Ethiopian month, for example `2019-03`. */
export function currentPeriodKey(now: Date = new Date()): string {
  const { year, month } = toEthiopian(parseGregorian(now));
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function periodLabel(key: string, locale: Locale, termLabel: (term: number) => string): string {
  const [year, part] = key.split("-");
  if (!part) return year;
  if (part.startsWith("T")) return `${termLabel(Number(part.slice(1)))} ${year}`;
  return `${ETHIOPIAN_MONTHS[locale][Number(part) - 1]} ${year}`;
}

/** Everything a school can bill for in a year; `value` is what the generate form submits. */
export function periodOptions(year: number, locale: Locale, termLabel: (term: number) => string) {
  const months = Array.from({ length: 12 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`;
    return { value: `monthly:${key}`, label: periodLabel(key, locale, termLabel) };
  });
  const terms = [1, 2, 3, 4].map((t) => {
    const key = `${year}-T${t}`;
    return { value: `term:${key}`, label: periodLabel(key, locale, termLabel) };
  });
  return [...months, ...terms, { value: `annual:${year}`, label: String(year) }];
}
