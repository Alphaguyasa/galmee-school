import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MarksForm } from "@/components/marks-forms";
import { currentSchoolYear } from "@/lib/school-year";
import { cn } from "@/lib/utils";
import { listMarks, listSubjects } from "@/server/dal/marks";
import { getSession } from "@/server/dal/session";
import { listClasses, listRegister } from "@/server/dal/students";
import { TERMS, marksQuerySchema } from "@/server/validation";

const chip = (active: boolean) =>
  cn(
    "flex h-12 shrink-0 items-center rounded-md border px-4 text-sm",
    active ? "border-primary bg-primary font-semibold text-primary-foreground" : "bg-card hover:bg-accent",
  );

export default async function MarksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = marksQuerySchema.parse(await searchParams);
  const [{ profile }, classes, t] = await Promise.all([getSession(), listClasses(), getTranslations("marks")]);
  const canManage = profile.role !== "staff";
  const selected = classes.find((c) => c.id === query.class) ?? classes[0];
  const term = query.term ?? 1;
  const subjects = selected ? await listSubjects(selected.grade) : [];
  const subject = subjects.find((s) => s.id === query.subject) ?? subjects[0];
  const register = selected && subject ? await listRegister({ year: currentSchoolYear(), classId: selected.id }) : [];
  const saved = subject ? await listMarks(subject.id, term, register.map((r) => r.enrollmentId)) : {};
  const entered = Object.keys(saved).length;
  const href = (p: { class?: string; subject?: string; term?: number }) =>
    `/marks?class=${p.class ?? selected?.id ?? ""}&term=${p.term ?? term}${p.subject ?? subject?.id ? `&subject=${p.subject ?? subject?.id}` : ""}`;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        {canManage ? (
          <Link href="/marks/subjects" className="flex h-12 items-center text-sm text-primary underline-offset-4 hover:underline">
            {t("subjects")}
          </Link>
        ) : null}
      </div>

      {!selected ? (
        <p className="border-l-2 border-margin py-3 pl-4 text-muted-foreground">{t("noClasses")}</p>
      ) : (
        <>
          <nav aria-label={t("classes")} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
            {classes.map((c) => (
              <Link
                key={c.id}
                href={`/marks?class=${c.id}&term=${term}`}
                aria-current={c.id === selected.id ? "page" : undefined}
                className={chip(c.id === selected.id)}
              >
                {c.grade} {c.section}
              </Link>
            ))}
          </nav>

          <nav aria-label={t("term")} className="grid grid-cols-4 gap-2 md:flex">
            {TERMS.map((n) => (
              <Link key={n} href={href({ term: n })} aria-current={n === term ? "page" : undefined} className={cn(chip(n === term), "justify-center")}>
                {t("termN", { n })}
              </Link>
            ))}
          </nav>

          {subjects.length === 0 ? (
            <p className="border-l-2 border-margin py-3 pl-4 text-muted-foreground">
              {canManage ? t("noSubjectsForGrade") : t("noSubjectsAskOffice")}
            </p>
          ) : (
            <>
              <nav aria-label={t("subjects")} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
                {subjects.map((s) => (
                  <Link
                    key={s.id}
                    href={href({ subject: s.id })}
                    aria-current={s.id === subject?.id ? "page" : undefined}
                    className={chip(s.id === subject?.id)}
                  >
                    {s.name}
                  </Link>
                ))}
              </nav>

              <p aria-live="polite" className="num text-sm font-semibold">
                {t("entered", { entered, total: register.length })}
              </p>

              {register.length === 0 ? (
                <p className="border-l-2 border-margin py-3 pl-4 text-muted-foreground">{t("emptyClass")}</p>
              ) : subject ? (
                <MarksForm
                  key={`${selected.id}-${subject.id}-${term}`}
                  subjectId={subject.id}
                  term={term}
                  maxMark={subject.maxMark}
                  rows={register.map((r) => ({
                    enrollmentId: r.enrollmentId,
                    rollNo: r.rollNo,
                    fullName: r.fullName,
                    mark: saved[r.enrollmentId] ?? null,
                  }))}
                />
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
}
