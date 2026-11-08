import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { CalendarDays, ChevronRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { formatEthiopianDate } from "@/lib/ethiopian-date";
import { currentSchoolYear } from "@/lib/school-year";
import { getSession } from "@/server/dal/session";
import { registerCounts } from "@/server/dal/students";

export default async function HomePage() {
  const [{ profile }, counts, t, tCommon, locale] = await Promise.all([
    getSession(),
    registerCounts(currentSchoolYear()),
    getTranslations("home"),
    getTranslations("common"),
    getLocale() as Promise<Locale>,
  ]);

  const rows = [
    { label: t("studentsThisYear"), value: counts.students },
    { label: t("classes"), value: counts.classes },
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
            <Link href="/students" className="grid min-h-16 grid-cols-[4rem_1fr_auto] items-stretch hover:bg-accent/60">
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
