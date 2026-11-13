import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, IdCard } from "lucide-react";
import { PrintButton } from "@/components/print-button";
import { EmptyState } from "@/components/galmee/empty-state";
import { CARDS_PER_SHEET, chunk, initials, qrPath, studentCardPayload } from "@/lib/id-card";
import { currentSchoolYear } from "@/lib/school-year";
import { getSession } from "@/server/dal/session";
import { listClasses, listRegister, signedPhotoUrls, type RegisterRowDTO } from "@/server/dal/students";
import { StudentPhotoButton } from "@/components/student-photo-button";
import { marksQuerySchema } from "@/server/validation";

/** Student ID cards for one class, laid out ten to an A4 sheet (ID-1 size, 85.6 x 54 mm). */
export default async function IdCardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = marksQuerySchema.parse(await searchParams);
  const [{ tenant, profile }, classes, t] = await Promise.all([getSession(), listClasses(), getTranslations("students")]);
  const selected = classes.find((c) => c.id === query.class);
  if (!selected) notFound();
  const year = currentSchoolYear();
  const register = await listRegister({ year, classId: selected.id });
  const classLabel = `${selected.grade} ${selected.section}`;
  const sheets = chunk(register, CARDS_PER_SHEET);
  const photos = await signedPhotoUrls(register.flatMap((r) => (r.photoPath ? [r.photoPath] : [])));
  const canEditPhotos = profile.role !== "staff";
  const photoLabels = {
    add: t("photoAdd"),
    change: t("photoChange"),
    saving: t("photoSaving"),
    failed: t("photoFailed"),
  };

  return (
    <div className="grid gap-4">
      <Link
        href={`/students?class=${selected.id}`}
        className="flex h-12 items-center gap-2 justify-self-start text-sm text-primary print:hidden"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToRegister")}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold">
            {t("idCards")} · {classLabel}
          </h1>
          {register.length > 0 ? (
            <p className="num text-sm text-muted-foreground">
              {t("idCardsSheets", { cards: register.length, sheets: sheets.length })}
            </p>
          ) : null}
        </div>
        {register.length > 0 ? <PrintButton label={t("printIdCards")} /> : null}
      </div>

      {register.length === 0 ? (
        <EmptyState icon={IdCard} message={t("emptyClass")} />
      ) : (
        <>
          <p className="text-sm text-muted-foreground print:hidden">{t("idCardsHint")}</p>
          {sheets.map((sheet, i) => (
            <section
              key={i}
              aria-label={t("idCardsSheetN", { n: i + 1 })}
              className="id-sheet grid justify-items-center gap-3 sm:grid-cols-2 print:grid-cols-[85.6mm_85.6mm] print:justify-center print:gap-0 print:break-after-page print:last:break-after-auto"
            >
              {sheet.map((r) => (
                <div key={r.enrollmentId} className="grid w-full max-w-[85.6mm] gap-2 print:contents">
                  <StudentCard
                    row={r}
                    photoUrl={r.photoPath ? photos[r.photoPath] : undefined}
                    school={tenant.name}
                    year={year}
                    labels={{ card: t("idCardTitle"), cls: t("class"), no: t("studentNoShort"), year: t("yearShort") }}
                  />
                  {canEditPhotos ? (
                    <StudentPhotoButton
                      tenantId={tenant.id}
                      studentId={r.studentId}
                      hasPhoto={Boolean(r.photoPath)}
                      labels={photoLabels}
                    />
                  ) : null}
                </div>
              ))}
            </section>
          ))}
        </>
      )}
    </div>
  );
}

function StudentCard({
  row,
  photoUrl,
  school,
  year,
  labels,
}: {
  row: RegisterRowDTO;
  photoUrl?: string;
  school: string;
  year: number;
  labels: { card: string; cls: string; no: string; year: string };
}) {
  const qr = qrPath(studentCardPayload(row.studentId));
  const view = qr.size + 4;
  return (
    <article
      className="id-card grid w-full max-w-[85.6mm] grid-rows-[auto_1fr] overflow-hidden rounded-md border border-border bg-white text-[#14181f] [aspect-ratio:85.6/54] print:h-[54mm] print:w-[85.6mm] print:max-w-none print:rounded-none print:border-dashed print:border-[#9aa3ad] print:break-inside-avoid"
    >
      <header className="flex items-center justify-between gap-2 bg-[var(--trade)] px-[3mm] py-[1.5mm] text-white">
        <p className="truncate text-[3.2mm] leading-tight font-bold">{school}</p>
        <p className="shrink-0 text-[2.4mm] leading-tight tracking-wide uppercase opacity-90">{labels.card}</p>
      </header>
      <div className="grid min-h-0 grid-cols-[17mm_1fr_19mm] items-center gap-[2.5mm] px-[3mm] py-[2mm]">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from private storage
          <img src={photoUrl} alt="" className="h-[21mm] w-[17mm] rounded-sm border border-[#c9d0d8] object-cover" />
        ) : (
          <div
            aria-hidden
            className="grid h-[21mm] w-[17mm] place-items-center rounded-sm border border-[#c9d0d8] bg-[#eef1f4] text-[6mm] font-bold text-[#5b6672]"
          >
            {initials(row.fullName)}
          </div>
        )}
        <dl className="grid min-w-0 gap-[0.8mm] text-[2.6mm] leading-tight">
          <dt className="sr-only">Name</dt>
          <dd className="line-clamp-2 text-[3.6mm] font-bold">{row.fullName}</dd>
          <div className="flex gap-1">
            <dt className="text-[#5b6672]">{labels.cls}</dt>
            <dd className="font-semibold">{row.classLabel}</dd>
          </div>
          {row.studentNo ? (
            <div className="flex gap-1">
              <dt className="text-[#5b6672]">{labels.no}</dt>
              <dd className="num truncate font-semibold">{row.studentNo}</dd>
            </div>
          ) : null}
          <div className="flex gap-1">
            <dt className="text-[#5b6672]">{labels.year}</dt>
            <dd className="num font-semibold">{year}</dd>
          </div>
        </dl>
        <svg
          viewBox={`-2 -2 ${view} ${view}`}
          className="h-[19mm] w-[19mm]"
          role="img"
          aria-label={`QR ${row.studentNo ?? row.fullName}`}
          shapeRendering="crispEdges"
        >
          <rect x={-2} y={-2} width={view} height={view} fill="#fff" />
          <path d={qr.d} fill="#000" />
        </svg>
      </div>
    </article>
  );
}
