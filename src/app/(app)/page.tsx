import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { CalendarDays, ChevronRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { formatEthiopianDate } from "@/lib/ethiopian-date";
import { currentPeriodKey } from "@/lib/fee-period";
import { formatBirr, sumMoney } from "@/lib/money";
import { currentSchoolYear } from "@/lib/school-year";
import { listUnpaidByClass } from "@/server/dal/fees";
import { getSession } from "@/server/dal/session";
import { registerCounts } from "@/server/dal/students";

export default async function HomePage() {
  const year = currentSchoolYear();
  const [{ profile }, counts, unpaidRows, t, tCommon, locale] = await Promise.all([
    getSession(),
    registerCounts(year),
    listUnpaidByClass(year),
    getTranslations("home"),
    getTranslations("common"),
    getLocale() as Promise<Locale>,
  ]);

  const thisMonth = unpaidRows.filter((r) => r.periodKey === currentPeriodKey());
  const unpaid = thisMonth.reduce((n, r) => n + r.unpaidStudents, 0);
  const owed = sumMoney(thisMonth.map((r) => r.owed));

  const rows = [
    {
      label: thisMonth.length > 0 ? t("unpaidThisMonth", { owed: formatBirr(owed, locale) }) : t("noInvoicesThisMonth"),
      value: thisMonth.length > 0 ? unpaid : "-",
      href: "/fees",
    },
    { label: t("studentsThisYear"), value: counts.students, href: "/students" },
    { label: t("classes"), value: counts.classes, href: "/students" },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">{t("welcome", { name: profile.fullName })}</h1>
        <p className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="size-4" aria-hidden />
          <span className="num">
            {tCommon("today")}: {formatEthiopianDate(new Date(), locale)}
          </span>
        </p>
      </div>
      <ul className="border-t">
        {rows.map((row) => (
          <li key={row.label} className="border-b">
            <Link href={row.href} className="grid min-h-16 grid-cols-[4rem_1fr_auto] items-stretch hover:bg-accent/60">
              <span className="num flex items-center justify-center border-r-2 border-margin text-xl font-bold">
                {row.value}
              </span>
              <span className="flex items-center pl-3">{row.label}</span>
              <span className="flex items-center pr-2 text-muted-foreground">
                <ChevronRight className="size-5" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {counts.classes === 0 && profile.role !== "staff" ? <p>{t("startHint")}</p> : null}
    </div>
  );
}
