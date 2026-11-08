import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { StudentForm } from "@/components/student-form";
import { getSession } from "@/server/dal/session";
import { listClasses } from "@/server/dal/students";
import { registerQuerySchema } from "@/server/validation";

export default async function NewStudentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { class: classId } = registerQuerySchema.parse(sp);
  const [, classes, t] = await Promise.all([getSession(), listClasses(), getTranslations("students")]);
  if (classes.length === 0) redirect("/students");
  const defaultClass = classes.some((c) => c.id === classId) ? classId : classes[0].id;

  return (
    <div className="grid max-w-md gap-4">
      <Link
        href={`/students?class=${defaultClass}`}
        className="flex h-12 items-center gap-2 justify-self-start text-sm text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToRegister")}
      </Link>
      <h1 className="text-2xl font-semibold">{t("addStudent")}</h1>
      {sp.added ? (
        <p role="status" className="rounded-md bg-accent p-3 text-sm">
          {t("studentAdded")}
        </p>
      ) : null}
      {/* Keyed so the form clears after each student during bulk entry. */}
      <StudentForm
        key={String(sp.added ?? defaultClass)}
        classes={classes.map((c) => ({ id: c.id, label: `${c.grade} ${c.section}` }))}
        defaultClass={defaultClass}
      />
    </div>
  );
}
