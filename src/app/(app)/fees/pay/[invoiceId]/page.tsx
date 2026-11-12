import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, CircleCheck, Printer } from "lucide-react";
import { PaymentForm } from "@/components/fee-forms";
import { ListRow, ListSheet } from "@/components/galmee/list-row";
import { StatusBadge } from "@/components/galmee/status-badge";
import type { Locale } from "@/i18n/config";
import { formatEthiopianDate } from "@/lib/ethiopian-date";
import { periodLabel } from "@/lib/fee-period";
import { formatBirr } from "@/lib/money";
import { getInvoice, listInvoiceReceipts } from "@/server/dal/fees";
import { uuidParam } from "@/server/validation";

export default async function PayFeePage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  if (!uuidParam.safeParse(invoiceId).success) notFound();
  const [invoice, receipts, t, locale] = await Promise.all([
    getInvoice(invoiceId),
    listInvoiceReceipts(invoiceId),
    getTranslations("fees"),
    getLocale() as Promise<Locale>,
  ]);
  if (!invoice) notFound();
  const paid = invoice.status === "paid";

  return (
    <div className="grid max-w-md gap-4">
      <Link
        href={`/fees/class/${invoice.classId}?period=${invoice.periodKey}`}
        className="flex h-12 items-center gap-2 justify-self-start text-sm text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {invoice.classLabel}
      </Link>
      <div className="grid gap-1">
        <h1 className="text-[1.5625rem] leading-tight font-bold">{invoice.fullName}</h1>
        <p className="text-muted-foreground">
          {invoice.description} · {periodLabel(invoice.periodKey, locale, (n) => t("term", { n }))}
        </p>
      </div>
      {paid ? (
        <StatusBadge tone="ok" icon={CircleCheck} className="justify-self-start">
          {t("statusPaid")} · <span className="num">{formatBirr(invoice.amount, locale)}</span>
        </StatusBadge>
      ) : (
        <>
          <div className="grid gap-1 border-l-2 border-margin py-1 pl-4">
            <p className="num text-3xl font-bold">{formatBirr(invoice.remaining, locale)}</p>
            <p className="num text-sm text-muted-foreground">{t("ofTotal", { total: formatBirr(invoice.amount, locale) })}</p>
          </div>
          <PaymentForm invoiceId={invoice.invoiceId} remaining={invoice.remaining} />
        </>
      )}
      {receipts.length > 0 ? (
        <section aria-labelledby="receipts" className="grid gap-2">
          <h2 id="receipts" className="font-semibold">
            {t("receiptsHeading")}
          </h2>
          <ListSheet>
            {receipts.map((r) => (
              <ListRow
                key={r.receiptId}
                href={`/fees/receipts/${r.receiptId}`}
                title={<span className="num">{t("receiptNo", { no: r.receiptNo })}</span>}
                sub={<span className="num">{formatEthiopianDate(r.createdAt, locale)}</span>}
                right={
                  <>
                    <span className="num font-semibold">{formatBirr(r.amount, locale)}</span>
                    <span className="flex items-center gap-1 text-sm text-primary">
                      <Printer className="size-4" aria-hidden />
                      {t("reprint")}
                    </span>
                  </>
                }
              />
            ))}
          </ListSheet>
        </section>
      ) : null}
    </div>
  );
}
