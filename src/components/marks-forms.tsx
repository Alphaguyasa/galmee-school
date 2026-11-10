"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { addSubjectAction, saveMarksAction } from "@/actions/marks";
import { FormFeedback } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function SubjectForm({ grades }: { grades: string[] }) {
  const t = useTranslations("marks");
  const [state, action, pending] = useActionState(addSubjectAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">{t("subjectName")}</Label>
        <Input id="name" name="name" placeholder={t("subjectNameExample")} maxLength={80} required />
      </div>
      <div className="grid grid-cols-2 items-end gap-3">
        <div className="grid gap-2">
          <Label htmlFor="grade">{t("subjectGrade")}</Label>
          <Select id="grade" name="grade" defaultValue="">
            <option value="">{t("allGrades")}</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="maxMark">{t("maxMark")}</Label>
          <Input id="maxMark" name="maxMark" inputMode="decimal" autoComplete="off" defaultValue="100" required />
        </div>
      </div>
      <FormFeedback state={state} t={t} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {t("addSubject")}
      </Button>
    </form>
  );
}

export type MarkRow = { enrollmentId: string; rollNo: number | null; fullName: string; mark: number | null };

export function MarksForm({
  subjectId,
  term,
  maxMark,
  rows,
}: {
  subjectId: string;
  term: number;
  maxMark: number;
  rows: MarkRow[];
}) {
  const t = useTranslations("marks");
  const [state, action, pending] = useActionState(saveMarksAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="subjectId" value={subjectId} />
      <input type="hidden" name="term" value={term} />
      <ul className="border-t">
        {rows.map((r) => (
          <li key={r.enrollmentId} className="grid min-h-14 grid-cols-[2.75rem_1fr_6rem] items-center border-b">
            <span className="num flex h-full items-center justify-center border-r-2 border-margin text-sm text-muted-foreground">
              {r.rollNo ?? ""}
            </span>
            <label htmlFor={`mark_${r.enrollmentId}`} className="truncate py-2 pl-3 font-semibold">
              {r.fullName}
            </label>
            <Input
              id={`mark_${r.enrollmentId}`}
              name={`mark_${r.enrollmentId}`}
              inputMode="decimal"
              autoComplete="off"
              pattern="\d{1,4}(\.\d{1,2})?"
              defaultValue={r.mark ?? ""}
              aria-describedby="mark-out-of"
              className="num text-right"
            />
          </li>
        ))}
      </ul>
      <p id="mark-out-of" className="num text-sm text-muted-foreground">
        {t("outOf", { max: maxMark })}
      </p>
      <FormFeedback state={state} t={t} />
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-4">
        <Button type="submit" size="lg" className="w-full md:w-auto" disabled={pending} aria-busy={pending}>
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
