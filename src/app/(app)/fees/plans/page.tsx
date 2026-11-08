import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { FeePlanForm } from "@/components/fee-forms";
import type { Locale } from "@/i18n/config";
import { formatBirr } from "@/lib/money";
import { listFeePlans } from "@/server/dal/fees";
import { getSession } from "@/server/dal/session";
import { listClasses } from "@/server/dal/students";

export default async function FeePlansPage() {
  const [{ profile }, plans, classes, t, locale] = await Promise.all([
    getSession(),
    listFeePlans(),
    listClasses(),
    getTranslations("fees"),
    getLocale() as Promise<Locale>,
  ]);
  if (profile.role === "staff") redirect("/fees");
  const grades = [...new Set(classes.map((c) => c.grade))];
  const periodWord = { monthly: t("periodMonthly"), term: t("periodTerm"), annual: t("periodAnnual") } as Record<string, string>;

  return (
    <div className="grid max-w-md gap-4">
      <Link href="/fees" className="flex h-12 items-center gap-2 justify-self-start text-sm text-primary">
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToFees")}
      </Link>
      <h1 className="text-2xl font-semibold">{t("plans")}</h1>
      {plans.length > 0 ? (
        <ul className="border-t">
          {plans.map((p) => (
            <li key={p.id} className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-2 border-b py-2">
              <span className="grid min-w-0">
                <span className="truncate font-semibold">{p.name}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {p.grade ?? t("allGrades")} · {periodWord[p.period] ?? p.period}
                </span>
              </span>
              <span className="num font-semibold">{formatBirr(p.amount, locale)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-l-2 border-margin py-3 pl-4 text-muted-foreground">{t("noPlans")}</p>
      )}
      <FeePlanForm grades={grades} />
    </div>
  );
}
