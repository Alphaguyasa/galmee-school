import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Phone } from "lucide-react";
import { currentSchoolYear } from "@/lib/school-year";
import { listParentContacts } from "@/server/dal/students";

export default async function ParentContactsPage() {
  const [parents, t] = await Promise.all([listParentContacts(currentSchoolYear()), getTranslations("students")]);

  return (
    <div className="grid gap-4">
      <Link href="/students" className="flex h-12 items-center gap-2 justify-self-start text-sm text-primary">
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToRegister")}
      </Link>
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">{t("parentsTitle")}</h1>
        <p className="num text-sm text-muted-foreground">{t("parentCount", { count: parents.length })}</p>
      </div>
      {parents.length === 0 ? (
        <p className="border-l-2 border-margin py-3 pl-4 text-muted-foreground">{t("noParents")}</p>
      ) : (
        <ul className="border-t">
          {parents.map((p) => (
            <li key={p.guardianId} className="grid min-h-16 grid-cols-[1fr_auto] items-stretch border-b">
              <div className="grid min-w-0 content-center border-l-2 border-margin py-2 pl-3">
                <span className="truncate font-semibold">{p.name}</span>
                <span className="num text-sm">{p.phone}</span>
                <span className="text-sm text-muted-foreground">{p.children.join(", ")}</span>
              </div>
              <a
                href={`tel:${p.phone}`}
                aria-label={t("call", { name: p.name })}
                className="flex w-12 items-center justify-center text-primary"
              >
                <Phone className="size-5" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
