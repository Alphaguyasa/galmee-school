import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AttendanceForm } from "@/components/attendance-form";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { formatEthiopianDate } from "@/lib/ethiopian-date";
import { addisToday, currentSchoolYear, shiftDay } from "@/lib/school-year";
import { cn } from "@/lib/utils";
import { listAttendance, listClasses, listRegister } from "@/server/dal/students";
import { attendanceQuerySchema } from "@/server/validation";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = attendanceQuerySchema.parse(await searchParams);
  const today = addisToday();
  const day = query.day ?? today;
  const [classes, t, locale] = await Promise.all([
    listClasses(),
    getTranslations("attendance"),
    getLocale() as Promise<Locale>,
  ]);
  const selected = classes.find((c) => c.id === query.class) ?? classes[0];
  const register = selected ? await listRegister({ year: currentSchoolYear(), classId: selected.id }) : [];
  const saved = await listAttendance(day, register.map((r) => r.enrollmentId));

  const hasSaved = Object.keys(saved).length > 0;
  const statuses = Object.values(saved);
  const absent = statuses.filter((s) => s === "absent").length;
  const late = statuses.filter((s) => s === "late").length;
  const dayHref = (d: string) => `/attendance?class=${selected?.id ?? ""}&day=${d}`;

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      {!selected ? (
        <p className="border-l-2 border-margin py-3 pl-4 text-muted-foreground">{t("noClasses")}</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <Link href={dayHref(shiftDay(day, -1))} aria-label={t("previousDay")} className={buttonVariants({ variant: "outline", size: "icon" })}>
              <ChevronLeft aria-hidden />
            </Link>
            <p className="num text-center font-semibold">{formatEthiopianDate(day, locale)}</p>
            {day < today ? (
              <Link href={dayHref(shiftDay(day, 1))} aria-label={t("nextDay")} className={buttonVariants({ variant: "outline", size: "icon" })}>
                <ChevronRight aria-hidden />
              </Link>
            ) : (
              <span className="size-12" aria-hidden />
            )}
          </div>

          <nav aria-label={t("title")} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
            {classes.map((c) => (
              <Link
                key={c.id}
                href={`/attendance?class=${c.id}&day=${day}`}
                aria-current={c.id === selected.id ? "page" : undefined}
                className={cn(
                  "flex h-12 shrink-0 items-center rounded-md border px-4 text-sm",
                  c.id === selected.id ? "border-primary bg-primary font-semibold text-primary-foreground" : "bg-card hover:bg-accent",
                )}
              >
                {c.grade} {c.section}
              </Link>
            ))}
          </nav>

          <p aria-live="polite" className="num text-sm font-semibold">
            {hasSaved ? t("summary", { absent, late, total: register.length }) : t("notSavedYet")}
          </p>

          {register.length === 0 ? (
            <p className="border-l-2 border-margin py-3 pl-4 text-muted-foreground">{t("emptyClass")}</p>
          ) : (
            <AttendanceForm
              key={`${selected.id}-${day}`}
              day={day}
              rows={register.map((r) => ({
                enrollmentId: r.enrollmentId,
                rollNo: r.rollNo,
                fullName: r.fullName,
                status: saved[r.enrollmentId] ?? "present",
              }))}
            />
          )}
        </>
      )}
    </div>
  );
}
