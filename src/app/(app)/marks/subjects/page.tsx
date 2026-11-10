import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { SubjectForm } from "@/components/marks-forms";
import { listSubjects } from "@/server/dal/marks";
import { getSession } from "@/server/dal/session";
import { listClasses } from "@/server/dal/students";

export default async function SubjectsPage() {
  const [{ profile }, subjects, classes, t] = await Promise.all([
    getSession(),
    listSubjects(),
    listClasses(),
    getTranslations("marks"),
  ]);
  if (profile.role === "staff") redirect("/marks");
  const grades = [...new Set(classes.map((c) => c.grade))];

  return (
    <div className="grid max-w-md gap-4">
      <Link href="/marks" className="flex h-12 items-center gap-2 justify-self-start text-sm text-primary">
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToMarks")}
      </Link>
      <h1 className="text-2xl font-semibold">{t("subjects")}</h1>
      {subjects.length > 0 ? (
        <ul className="border-t">
          {subjects.map((s) => (
            <li key={s.id} className="grid min-h-14 grid-cols-[1fr_auto] items-center gap-2 border-b py-2">
              <span className="grid min-w-0">
                <span className="truncate font-semibold">{s.name}</span>
                <span className="truncate text-sm text-muted-foreground">{s.grade ?? t("allGrades")}</span>
              </span>
              <span className="num text-sm text-muted-foreground">{t("outOf", { max: s.maxMark })}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-l-2 border-margin py-3 pl-4 text-muted-foreground">{t("noSubjects")}</p>
      )}
      <SubjectForm grades={grades} />
    </div>
  );
}
