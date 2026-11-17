import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, Download, ReceiptText } from "lucide-react";
import { EmptyState } from "@/components/galmee/empty-state";
import { ListRow, ListSheet } from "@/components/galmee/list-row";
import { MoneySummaryCard } from "@/components/galmee/money-summary-card";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { COLLECTION_RANGES, collectionWindow } from "@/lib/collections";
import { formatEthiopianDate } from "@/lib/ethiopian-date";
import { formatBirr, sumMoney } from "@/lib/money";
import { payMethodKey } from "@/lib/pay-method";
import { cn } from "@/lib/utils";
import { listCollections } from "@/server/dal/fees";
import { getSession } from "@/server/dal/session";
import { collectionsQuerySchema } from "@/server/validation";

const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Addis_Ababa" });

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { range } = collectionsQuerySchema.parse(await searchParams);
  const { profile } = await getSession();
  if (profile.role !== "owner" && profile.role !== "manager") redirect("/fees");

  const { from, to } = collectionWindow(range);
  const [rows, t, locale] = await Promise.all([
    listCollections(from, to),
    getTranslations("fees"),
    getLocale() as Promise<Locale>,
  ]);
  const total = sumMoney(rows.map((r) => r.amount));
  const byMethod = new Map<string, number[]>();
  for (const r of rows) {
    const key = payMethodKey(r.method);
    byMethod.set(key, [...(byMethod.get(key) ?? []), r.amount]);
  }
  const lastDay = new Date(to.getTime() - 1);
  const windowLabel =
    range === "today"
      ? formatEthiopianDate(from, locale)
      : `${formatEthiopianDate(from, locale, { withEra: false })} – ${formatEthiopianDate(lastDay, locale)}`;

  return (
    <div className="grid gap-4">
      <Link href="/fees" className="flex h-12 items-center gap-2 justify-self-start text-sm text-primary">
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToFees")}
      </Link>
      <h1 className="text-[1.5625rem] leading-tight font-bold">{t("collectionsTitle")}</h1>

      <nav aria-label={t("collectionsRange")} className="flex gap-2">
        {COLLECTION_RANGES.map((r) => (
          <Link
            key={r}
            href={`/fees/collections?range=${r}`}
            aria-current={r === range ? "page" : undefined}
            className={cn(
              "flex h-12 items-center rounded-md border px-4 text-sm",
              r === range ? "border-primary bg-primary font-semibold text-primary-foreground" : "bg-card hover:bg-accent",
            )}
          >
            {t(r === "today" ? "rangeToday" : "rangeMonth")}
          </Link>
        ))}
      </nav>

      <MoneySummaryCard
        tone="in"
        label={t("collectedLabel")}
        figure={formatBirr(total, locale)}
        sub={`${windowLabel} · ${t("receiptCount", { count: rows.length })}`}
      />

      {rows.length === 0 ? (
        <EmptyState icon={ReceiptText} message={t("noCollections")} />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 border-l-2 border-margin py-1 pl-4 text-sm">
            {[...byMethod.entries()].map(([key, amounts]) => (
              <div key={key} className="contents">
                <dt className="text-muted-foreground">{t(key)}</dt>
                <dd className="num text-right font-semibold">{formatBirr(sumMoney(amounts), locale)}</dd>
              </div>
            ))}
          </dl>
          <a href={`/fees/collections/export?range=${range}`} className={cn(buttonVariants({ variant: "outline" }), "justify-self-start")}>
            <Download aria-hidden />
            {t("downloadCsv")}
          </a>
          <ListSheet>
            {rows.map((r) => (
              <ListRow
                key={r.receiptNo}
                mark={<span className="num text-xs text-muted-foreground">{TIME.format(new Date(r.createdAt))}</span>}
                title={r.fullName}
                sub={
                  <span className="num">
                    {t("receiptNo", { no: r.receiptNo })} · {r.classLabel} · {t(payMethodKey(r.method))}
                  </span>
                }
                right={<span className="num font-semibold">{formatBirr(r.amount, locale)}</span>}
              />
            ))}
          </ListSheet>
        </>
      )}
    </div>
  );
}
