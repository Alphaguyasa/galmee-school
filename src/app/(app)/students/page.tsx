import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Phone, Search, Settings2, UserPlus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { currentSchoolYear } from "@/lib/school-year";
import { cn } from "@/lib/utils";
import { getSession } from "@/server/dal/session";
import { listClasses, listRegister } from "@/server/dal/students";
import { registerQuerySchema } from "@/server/validation";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = registerQuerySchema.parse(await searchParams);
  const year = currentSchoolYear();
  const [{ profile }, classes, t] = await Promise.all([getSession(), listClasses(), getTranslations("students")]);
  const canManage = profile.role !== "staff";
  const q = query.q || undefined;
  const selected = q ? undefined : (classes.find((c) => c.id === query.class) ?? classes[0]);
  const rows = await listRegister({ year, classId: selected?.id, q });
  const newHref = selected ? `/students/new?class=${selected.id}` : "/students/new";

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="num text-sm text-muted-foreground">{t("schoolYear", { year })}</p>
        </div>
        <div className="flex gap-2">
          {classes.length > 0 ? (
            <Link href={newHref} className={cn(buttonVariants(), "hidden md:inline-flex")}>
              <UserPlus aria-hidden />
              {t("addStudent")}
            </Link>
          ) : null}
          {canManage ? (
            <Link href="/students/classes" className={buttonVariants({ variant: "outline" })}>
              <Settings2 aria-hidden />
              {t("manageClasses")}
            </Link>
          ) : null}
        </div>
      </div>

      {classes.length === 0 ? (
        <section className="grid gap-3 border-l-2 border-margin py-2 pl-4">
          <h2 className="font-semibold">{t("noClasses")}</h2>
          <p className="text-muted-foreground">{canManage ? t("noClassesOwner") : t("noClassesStaff")}</p>
          {canManage ? (
            <Link href="/students/classes" className={cn(buttonVariants({ size: "lg" }), "justify-self-start")}>
              {t("addClass")}
            </Link>
          ) : null}
        </section>
      ) : (
        <>
          <form action="/students" role="search" className="flex gap-2">
            <label htmlFor="q" className="sr-only">
              {t("searchLabel")}
            </label>
            <Input id="q" name="q" type="search" defaultValue={q} placeholder={t("searchPlaceholder")} autoComplete="off" />
            <Button type="submit" size="icon" aria-label={t("search")}>
              <Search aria-hidden />
            </Button>
          </form>

          <nav aria-label={t("class")} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
            {classes.map((c) => {
              const active = c.id === selected?.id;
              return (
                <Link
                  key={c.id}
                  href={`/students?class=${c.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-12 shrink-0 items-center rounded-md border px-4 text-sm",
                    active ? "border-primary bg-primary font-semibold text-primary-foreground" : "bg-card hover:bg-accent",
                  )}
                >
                  {c.grade} {c.section}
                </Link>
              );
            })}
          </nav>

          <p aria-live="polite" className="num text-sm font-semibold">
            {q ? t("searchResults", { count: rows.length, q }) : t("count", { count: rows.length })}
          </p>

          {rows.length === 0 ? (
            <p className="border-l-2 border-margin py-3 pl-4 text-muted-foreground">
              {q ? t("noMatch") : t("emptyClass")}
            </p>
          ) : (
            <ul className="border-t">
              {rows.map((r) => (
                <li key={r.enrollmentId} className="grid min-h-16 grid-cols-[2.75rem_1fr_auto] items-stretch border-b">
                  <span className="num flex items-center justify-center border-r-2 border-margin text-sm text-muted-foreground">
                    {r.rollNo ?? ""}
                  </span>
                  <div className="grid min-w-0 content-center py-2 pl-3">
                    <span className="truncate font-semibold">{r.fullName}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {q ? `${r.classLabel} · ` : ""}
                      {r.guardianName ?? t("noParent")}
                    </span>
                  </div>
                  {r.guardianPhone ? (
                    <a
                      href={`tel:${r.guardianPhone}`}
                      aria-label={t("call", { name: r.guardianName ?? r.fullName })}
                      className="flex w-12 items-center justify-center text-primary"
                    >
                      <Phone className="size-5" aria-hidden />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:hidden">
            <Link href={newHref} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
              <UserPlus aria-hidden />
              {t("addStudent")}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
