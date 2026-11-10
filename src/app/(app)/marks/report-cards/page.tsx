import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/print-button";
import { currentSchoolYear } from "@/lib/school-year";
import { listClassTermMarks, listClassTermRanks, listSubjects } from "@/server/dal/marks";
import { getSession } from "@/server/dal/session";
import { listClasses, listRegister } from "@/server/dal/students";
import { marksQuerySchema } from "@/server/validation";

/** Printable report cards for a whole class and term, one card per page. */
export default async function ReportCardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = marksQuerySchema.parse(await searchParams);
  const [{ tenant }, classes, t] = await Promise.all([
    getSession(),
    listClasses(),
    getTranslations("marks"),
  ]);
  const selected = classes.find((c) => c.id === query.class);
  if (!selected) notFound();
  const term = query.term ?? 1;
  const year = currentSchoolYear();
  const [subjects, register, ranks] = await Promise.all([
    listSubjects(selected.grade),
    listRegister({ year, classId: selected.id }),
    listClassTermRanks(selected.id, year, term),
  ]);
  const marks = await listClassTermMarks(term, register.map((r) => r.enrollmentId));
  const num = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  const classLabel = `${selected.grade} ${selected.section}`;

  return (
    <div className="grid max-w-2xl gap-4">
      <Link
        href={`/marks?class=${selected.id}&term=${term}`}
        className="flex h-12 items-center gap-2 justify-self-start text-sm text-primary print:hidden"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToMarks")}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <h1 className="text-2xl font-semibold">
          {t("reportCards")} · {classLabel} · {t("termN", { n: term })}
        </h1>
        {register.length > 0 && subjects.length > 0 ? <PrintButton label={t("printCards")} /> : null}
      </div>

      {register.length === 0 || subjects.length === 0 ? (
        <p className="border-l-2 border-margin py-3 pl-4 text-muted-foreground">{t("nothingToPrint")}</p>
      ) : (
        register.map((r) => {
          const own = marks[r.enrollmentId] ?? {};
          const rank = ranks[r.enrollmentId];
          return (
            <article
              key={r.enrollmentId}
              className="grid gap-3 break-after-page border-l-2 border-margin bg-card p-4 print:border-l-0 print:p-0 print:last:break-after-auto"
            >
              <header className="grid gap-1">
                <p className="text-sm text-muted-foreground">{tenant.name}</p>
                <h2 className="text-xl font-bold">{r.fullName}</h2>
                <p className="num text-sm">
                  {classLabel} · {t("termN", { n: term })} · {year}
                  {r.studentNo ? ` · ${r.studentNo}` : ""}
                </p>
              </header>
              <table className="w-full border-t text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th scope="col" className="py-2 font-medium">{t("subject")}</th>
                    <th scope="col" className="py-2 text-right font-medium">{t("mark")}</th>
                    <th scope="col" className="py-2 text-right font-medium">{t("maxMark")}</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr key={s.id} className="border-b">
                      <th scope="row" className="py-2 text-left font-medium">{s.name}</th>
                      <td className="num py-2 text-right font-semibold">{own[s.id] !== undefined ? num.format(own[s.id]) : "–"}</td>
                      <td className="num py-2 text-right text-muted-foreground">{num.format(s.maxMark)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <dl className="num grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("total")}</dt>
                  <dd className="text-lg font-bold">{rank ? num.format(rank.total) : "–"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("average")}</dt>
                  <dd className="text-lg font-bold">{rank ? num.format(rank.average) : "–"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("rank")}</dt>
                  <dd className="text-lg font-bold">{rank ? t("rankOf", { rank: rank.rank, size: rank.classSize }) : "–"}</dd>
                </div>
              </dl>
              <p className="grid grid-cols-2 gap-6 pt-6 text-xs text-muted-foreground">
                <span className="border-t pt-1">{t("teacherSignature")}</span>
                <span className="border-t pt-1">{t("parentSignature")}</span>
              </p>
            </article>
          );
        })
      )}
    </div>
  );
}
