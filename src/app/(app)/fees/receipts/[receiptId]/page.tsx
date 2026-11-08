import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PrintButton } from "@/components/print-button";
import type { Locale } from "@/i18n/config";
import { formatEthiopianDate } from "@/lib/ethiopian-date";
import { periodLabel } from "@/lib/fee-period";
import { formatBirr } from "@/lib/money";
import { getReceipt } from "@/server/dal/fees";
import { getSession } from "@/server/dal/session";
import { uuidParam } from "@/server/validation";

const METHOD_KEYS: Record<string, string> = {
  cash: "methodCash",
  telebirr: "methodTelebirr",
  cbe_birr: "methodCbe",
  bank: "methodBank",
  other: "methodOther",
};

export default async function ReceiptPage({ params }: { params: Promise<{ receiptId: string }> }) {
  const { receiptId } = await params;
  if (!uuidParam.safeParse(receiptId).success) notFound();
  const [{ tenant }, receipt, t, locale] = await Promise.all([
    getSession(),
    getReceipt(receiptId),
    getTranslations("fees"),
    getLocale() as Promise<Locale>,
  ]);
  if (!receipt) notFound();

  const lines: [string, string][] = [
    [t("student"), receipt.fullName],
    [t("classLabel"), receipt.classLabel],
    [t("forFee"), `${receipt.description}, ${periodLabel(receipt.periodKey, locale, (n) => t("term", { n }))}`],
    [t("method"), METHOD_KEYS[receipt.method] ? t(METHOD_KEYS[receipt.method]) : receipt.method],
    [t("date"), formatEthiopianDate(receipt.createdAt, locale)],
  ];

  return (
    <div className="grid max-w-md gap-4">
      <p role="status" className="rounded-md bg-accent p-3 text-sm print:hidden">
        {t("paymentRecorded")}
      </p>
      <article className="grid gap-3 border-l-2 border-margin pl-4">
        <header className="grid gap-1">
          <h1 className="text-xl font-bold">{tenant.name}</h1>
          <p className="num text-sm text-muted-foreground">{t("receiptNo", { no: receipt.receiptNo })}</p>
        </header>
        <p className="num text-3xl font-bold">{formatBirr(receipt.amount, locale)}</p>
        <dl className="grid gap-2 border-t pt-3">
          {lines.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-2 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {receipt.remaining > 0 ? (
          <p className="num border-t pt-3 text-sm font-semibold">
            {t("stillOwed", { amount: formatBirr(receipt.remaining, locale) })}
          </p>
        ) : null}
      </article>
      <PrintButton label={t("printReceipt")} />
      <Link href="/fees" className="flex h-12 items-center justify-center text-sm text-primary print:hidden">
        {t("backToFees")}
      </Link>
    </div>
  );
}
