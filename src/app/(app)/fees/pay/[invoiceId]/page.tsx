import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { PaymentForm } from "@/components/fee-forms";
import type { Locale } from "@/i18n/config";
import { periodLabel } from "@/lib/fee-period";
import { formatBirr } from "@/lib/money";
import { getInvoice } from "@/server/dal/fees";
import { uuidParam } from "@/server/validation";

export default async function PayFeePage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  if (!uuidParam.safeParse(invoiceId).success) notFound();
  const [invoice, t, locale] = await Promise.all([
    getInvoice(invoiceId),
    getTranslations("fees"),
    getLocale() as Promise<Locale>,
  ]);
  if (!invoice) notFound();
  if (invoice.status === "paid") redirect(`/fees/class/${invoice.classId}?period=${invoice.periodKey}`);

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
        <h1 className="text-2xl font-semibold">{invoice.fullName}</h1>
        <p className="text-muted-foreground">
          {invoice.description} · {periodLabel(invoice.periodKey, locale, (n) => t("term", { n }))}
        </p>
      </div>
      <div className="grid gap-1 border-l-2 border-margin py-1 pl-4">
        <p className="num text-3xl font-bold">{formatBirr(invoice.remaining, locale)}</p>
        <p className="num text-sm text-muted-foreground">{t("ofTotal", { total: formatBirr(invoice.amount, locale) })}</p>
      </div>
      <PaymentForm invoiceId={invoice.invoiceId} remaining={invoice.remaining} />
    </div>
  );
}
