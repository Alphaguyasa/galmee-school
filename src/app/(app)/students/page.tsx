import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Contact, IdCard, Phone, School, Search, Settings2, UserPlus, Users } from "lucide-react";
import { EmptyState } from "@/components/galmee/empty-state";
import { ListRow, ListSheet } from "@/components/galmee/list-row";
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
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="grid gap-1">
          <h1 className="text-[1.5625rem] leading-tight font-bold">{t("title")}</h1>
          <p className="num text-sm text-muted-foreground">{t("schoolYear", { year })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {classes.length > 0 ? (
            <Link href={newHref} className={cn(buttonVariants(), "hidden md:inline-flex")}>
              <UserPlus aria-hidden />
              {t("addStudent")}
            </Link>
          ) : null}
          {selected ? (
            <Link href={`/students/id-cards?class=${selected.id}`} className={buttonVariants({ variant: "outline" })}>
              <IdCard aria-hidden />
              {t("idCards")}
            </Link>
          ) : null}
          <Link href="/students/parents" className={buttonVariants({ variant: "outline" })}>
            <Contact aria-hidden />
            {t("parents")}
          </Link>
          {canManage ? (
            <Link href="/students/classes" className={buttonVariants({ variant: "outline" })}>
              <Settings2 aria-hidden />
              {t("manageClasses")}
            </Link>
          ) : null}
        </div>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          icon={School}
          message={`${t("noClasses")} ${canManage ? t("noClassesOwner") : t("noClassesStaff")}`}
          action={
            canManage ? (
              <Link href="/students/classes" className={buttonVariants({ size: "lg" })}>
                {t("addClass")}
              </Link>
            ) : undefined
          }
        />
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
            <EmptyState icon={q ? Search : Users} message={q ? t("noMatch") : t("emptyClass")} />
          ) : (
            <ListSheet>
              {rows.map((r) => (
                <ListRow
                  key={r.enrollmentId}
                  className="items-center"
                  mark={
                    <span className="num flex h-10 w-8 items-center justify-center border-r-2 border-margin pr-2 text-sm text-muted-foreground">
                      {r.rollNo ?? ""}
                    </span>
                  }
                  title={r.fullName}
                  sub={
                    <span className="truncate">
                      {q ? `${r.classLabel} · ` : ""}
                      {r.guardianName ?? t("noParent")}
                    </span>
                  }
                  right={
                    r.guardianPhone ? (
                      <a
                        href={`tel:${r.guardianPhone}`}
                        aria-label={t("call", { name: r.guardianName ?? r.fullName })}
                        className="-my-2 flex size-12 items-center justify-center rounded-md text-primary active:bg-band"
                      >
                        <Phone className="size-5" aria-hidden />
                      </a>
                    ) : null
                  }
                />
              ))}
            </ListSheet>
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
