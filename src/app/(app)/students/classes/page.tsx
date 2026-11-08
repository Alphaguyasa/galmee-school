import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { ClassForm } from "@/components/class-form";
import { getSession } from "@/server/dal/session";
import { listClasses } from "@/server/dal/students";

export default async function ClassesPage() {
  const [{ profile }, classes, t] = await Promise.all([getSession(), listClasses(), getTranslations("students")]);
  if (profile.role === "staff") redirect("/students");

  return (
    <div className="grid max-w-md gap-4">
      <Link href="/students" className="flex h-12 items-center gap-2 justify-self-start text-sm text-primary">
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToRegister")}
      </Link>
      <h1 className="text-2xl font-semibold">{t("manageClasses")}</h1>
      <ClassForm />
      {classes.length > 0 ? (
        <ul className="border-t">
          {classes.map((c) => (
            <li key={c.id} className="grid min-h-12 grid-cols-[2.75rem_1fr] border-b">
              <span className="border-r-2 border-margin" aria-hidden />
              <span className="flex items-center pl-3">
                {c.grade} {c.section}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
