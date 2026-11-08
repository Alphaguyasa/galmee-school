import type { Locale } from "@/i18n/config";

const NUMBER = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Birr for display only: all money math happens in the database. */
export function formatBirr(amount: number, locale: Locale): string {
  const text = NUMBER.format(amount);
  return locale === "am" ? `ብር ${text}` : `${text} ETB`;
}

/** Adds amounts in whole cents so a displayed total has no float drift. */
export function sumMoney(amounts: number[]): number {
  return amounts.reduce((total, a) => total + Math.round(a * 100), 0) / 100;
}
