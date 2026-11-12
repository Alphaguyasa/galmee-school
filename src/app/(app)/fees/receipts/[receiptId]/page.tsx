import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ReceiptPreview } from "@/components/galmee/receipt-preview";
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

  const method = METHOD_KEYS[receipt.method] ? t(METHOD_KEYS[receipt.method]) : receipt.method;
  const paid = { label: `${t("receiptPaid")} (${method})`, amount: formatBirr(receipt.amount, locale) };
  const totals =
    receipt.remaining > 0
      ? [{ label: t("receiptOwedAfter"), amount: formatBirr(receipt.remaining, locale) }, paid]
      : [paid];

  return (
    <div className="grid max-w-md gap-4">
      <p role="status" className="rounded-md bg-accent p-3 text-sm print:hidden">
        {t("paymentRecorded")}
      </p>
      <ReceiptPreview
        className="mx-0 print:border-0 print:p-0"
        tenantName={tenant.name}
        title={t("receiptNo", { no: receipt.receiptNo })}
        dateLabel={formatEthiopianDate(receipt.createdAt, locale)}
        lines={[
          { name: `${t("student")}: ${receipt.fullName}`, qty: "", amount: "" },
          { name: `${t("classLabel")}: ${receipt.classLabel}`, qty: "", amount: "" },
          {
            name: `${receipt.description}, ${periodLabel(receipt.periodKey, locale, (n) => t("term", { n }))}`,
            qty: "",
            amount: formatBirr(receipt.amount, locale),
          },
        ]}
        totals={totals}
        footer={t("receiptFooter")}
      />
      <PrintButton label={t("printReceipt")} />
      <Link href="/fees" className="flex h-12 items-center justify-center text-sm text-primary print:hidden">
        {t("backToFees")}
      </Link>
    </div>
  );
}
