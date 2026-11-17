import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { collectionWindow, toCsv } from "@/lib/collections";
import { formatEthiopianDate, parseGregorian } from "@/lib/ethiopian-date";
import { payMethodKey } from "@/lib/pay-method";
import { listCollections } from "@/server/dal/fees";
import { getUserId } from "@/server/dal/session";
import { createClient } from "@/lib/supabase/server";
import { collectionsQuerySchema } from "@/server/validation";

/** Fee receipts of today or this Ethiopian month as CSV (owner and manager only). */
export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("role, active").eq("user_id", userId).maybeSingle();
  if (!profile?.active || (profile.role !== "owner" && profile.role !== "manager")) {
    return new Response("Forbidden", { status: 403 });
  }

  const { range } = collectionsQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  const { from, to } = collectionWindow(range);
  const [rows, t, locale] = await Promise.all([
    listCollections(from, to),
    getTranslations("fees"),
    getLocale() as Promise<Locale>,
  ]);

  const csv = toCsv([
    [t("csvReceiptNo"), t("date"), t("csvGregorian"), t("student"), t("classLabel"), t("forFee"), t("method"), t("csvAmount")],
    ...rows.map((r) => [
      r.receiptNo,
      formatEthiopianDate(r.createdAt, locale, { withEra: false }),
      r.createdAt,
      r.fullName,
      r.classLabel,
      r.description,
      t(payMethodKey(r.method)),
      r.amount.toFixed(2),
    ]),
  ]);
  const { year, month, day: d } = parseGregorian(from);
  const day = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="collections-${range}-${day}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
