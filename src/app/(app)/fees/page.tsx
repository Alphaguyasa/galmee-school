import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronRight, ListChecks } from "lucide-react";
import { GenerateInvoicesForm } from "@/components/fee-forms";
import { FeeStatusMark } from "@/components/fee-status";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { currentPeriodKey, periodLabel, periodOptions } from "@/lib/fee-period";
import { formatBirr, sumMoney } from "@/lib/money";
import { currentSchoolYear } from "@/lib/school-year";
import { cn } from "@/lib/utils";
import { listUnpaidByClass } from "@/server/dal/fees";
import { getSession } from "@/server/dal/session";
import { feesQuerySchema } from "@/server/validation";

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = feesQuerySchema.parse(await searchParams);
  const year = currentSchoolYear();
  const [{ profile }, allRows, t, locale] = await Promise.all([
    getSession(),
    listUnpaidByClass(year),
    getTranslations("fees"),
    getLocale() as Promise<Locale>,
  ]);
  const canManage = profile.role !== "staff";
  const term = (n: number) => t("term", { n });
  const period = query.period ?? currentPeriodKey();
  const periods = [...new Set([currentPeriodKey(), ...allRows.map((r) => r.periodKey)])].sort();
  const rows = allRows.filter((r) => r.periodKey === period);
  const owed = sumMoney(rows.map((r) => r.owed));
  const unpaid = rows.reduce((n, r) => n + r.unpaidStudents, 0);
  const students = rows.reduce((n, r) => n + r.students, 0);

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        {canManage ? (
          <Link href="/fees/plans" className={buttonVariants({ variant: "outline" })}>
            <ListChecks aria-hidden />
            {t("plans")}
          </Link>
        ) : null}
      </div>

      {query.generated !== undefined ? (
        <p role="status" className="rounded-md bg-accent p-3 text-sm">
          {t("generatedResult", { count: query.generated })}
        </p>
      ) : null}

      <nav aria-label={t("period")} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {periods.map((p) => (
          <Link
            key={p}
            href={`/fees?period=${p}`}
            aria-current={p === period ? "page" : undefined}
            className={cn(
              "flex h-12 shrink-0 items-center rounded-md border px-4 text-sm",
              p === period ? "border-primary bg-primary font-semibold text-primary-foreground" : "bg-card hover:bg-accent",
            )}
          >
            {periodLabel(p, locale, term)}
          </Link>
        ))}
      </nav>

      {rows.length > 0 ? (
        <div className="grid gap-1 border-l-2 border-margin py-1 pl-4">
          <p className="num text-3xl font-bold">{formatBirr(owed, locale)}</p>
          <p className="num">{t("unpaidSummary", { unpaid, students })}</p>
        </div>
      ) : (
        <p className="border-l-2 border-margin py-3 pl-4 text-muted-foreground">
          {t("noInvoices", { period: periodLabel(period, locale, term) })}
        </p>
      )}

      {rows.length > 0 ? (
        <ul className="border-t">
          {rows.map((r) => (
            <li key={r.classId} className="border-b">
              <Link
                href={`/fees/class/${r.classId}?period=${period}`}
                className="grid min-h-16 grid-cols-[2.75rem_1fr_auto] items-stretch hover:bg-accent/60"
              >
                <FeeStatusMark status={r.unpaidStudents === 0 ? "paid" : "unpaid"} />
                <span className="grid content-center py-2 pl-3">
                  <span className="font-semibold">{r.classLabel}</span>
                  <span className="num text-sm text-muted-foreground">
                    {r.unpaidStudents === 0 ? t("allPaid") : t("classUnpaid", { count: r.unpaidStudents, students: r.students })}
                  </span>
                </span>
                <span className="num flex items-center gap-1 pr-2 text-sm font-semibold">
                  {r.owed > 0 ? formatBirr(r.owed, locale) : null}
                  <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {canManage ? (
        <section className="border-t pt-4">
          <GenerateInvoicesForm
            options={periodOptions(year, locale, term)}
            defaultValue={period.includes("T") ? `term:${period}` : period.length === 4 ? `annual:${period}` : `monthly:${period}`}
          />
          <p className="mt-2 text-sm text-muted-foreground">{t("generateHint")}</p>
        </section>
      ) : null}
    </div>
  );
}
