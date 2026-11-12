import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { FeeStatusMark, feeStatusWord } from "@/components/fee-status";
import type { Locale } from "@/i18n/config";
import { currentPeriodKey, periodLabel } from "@/lib/fee-period";
import { formatBirr } from "@/lib/money";
import { listClassInvoices } from "@/server/dal/fees";
import { listClasses } from "@/server/dal/students";
import { feesQuerySchema, uuidParam } from "@/server/validation";

export default async function ClassFeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { classId } = await params;
  if (!uuidParam.safeParse(classId).success) notFound();
  const period = feesQuerySchema.parse(await searchParams).period ?? currentPeriodKey();
  const [classes, rows, t, locale] = await Promise.all([
    listClasses(),
    listClassInvoices(classId, period),
    getTranslations("fees"),
    getLocale() as Promise<Locale>,
  ]);
  const klass = classes.find((c) => c.id === classId);
  if (!klass) notFound();
  const sorted = [...rows].sort((a, b) => Number(a.status === "paid") - Number(b.status === "paid"));

  return (
    <div className="grid gap-4">
      <Link href={`/fees?period=${period}`} className="flex h-12 items-center gap-2 justify-self-start text-sm text-primary">
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToFees")}
      </Link>
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">
          {klass.grade} {klass.section}
        </h1>
        <p className="num text-sm text-muted-foreground">{periodLabel(period, locale, (n) => t("term", { n }))}</p>
      </div>
      {sorted.length === 0 ? (
        <p className="border-l-2 border-margin py-3 pl-4 text-muted-foreground">{t("noClassInvoices")}</p>
      ) : (
        <ul className="border-t">
          {sorted.map((r) => {
            const body = (
              <>
                <FeeStatusMark status={r.status} />
                <span className="grid min-w-0 content-center py-2 pl-3">
                  <span className="truncate font-semibold">{r.fullName}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {r.description} · {t(feeStatusWord(r.status))}
                  </span>
                </span>
                <span className="num flex items-center gap-1 pr-2 text-sm font-semibold">
                  {r.status === "paid" ? null : formatBirr(r.remaining, locale)}
                  <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
                </span>
              </>
            );
            const rowClass = "grid min-h-16 grid-cols-[2.75rem_1fr_auto] items-stretch";
            return (
              <li key={r.invoiceId} className="border-b">
                <Link href={`/fees/pay/${r.invoiceId}`} className={`${rowClass} hover:bg-accent/60`}>
                  {body}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
