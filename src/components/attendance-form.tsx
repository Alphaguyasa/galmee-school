"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { saveAttendanceAction } from "@/actions/attendance";
import { FormFeedback } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";

const STATUSES = [
  { value: "present", active: "peer-checked:border-paid peer-checked:bg-paid peer-checked:text-white" },
  { value: "absent", active: "peer-checked:border-margin peer-checked:bg-margin peer-checked:text-white" },
  { value: "late", active: "peer-checked:border-warning peer-checked:bg-warning peer-checked:text-white" },
  { value: "excused", active: "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground" },
] as const;

export type AttendanceRow = { enrollmentId: string; rollNo: number | null; fullName: string; status: string };

export function AttendanceForm({ day, rows }: { day: string; rows: AttendanceRow[] }) {
  const t = useTranslations("attendance");
  const [state, action, pending] = useActionState(saveAttendanceAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="day" value={day} />
      <ul className="border-t">
        {rows.map((r) => (
          <li key={r.enrollmentId} className="grid grid-cols-[2.75rem_1fr] border-b">
            <span className="num flex items-center justify-center border-r-2 border-margin text-sm text-muted-foreground">
              {r.rollNo ?? ""}
            </span>
            <fieldset className="grid min-w-0 gap-2 py-2 pl-3">
              <legend className="float-left truncate font-semibold">{r.fullName}</legend>
              <div className="clear-both grid grid-cols-4 gap-1">
                {STATUSES.map((s) => (
                  <label key={s.value} className="min-w-0 cursor-pointer">
                    <input
                      type="radio"
                      name={`mark_${r.enrollmentId}`}
                      value={s.value}
                      defaultChecked={r.status === s.value}
                      className="peer sr-only"
                    />
                    <span
                      className={`flex h-12 items-center justify-center truncate rounded-md border px-1 text-xs peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 ${s.active}`}
                    >
                      {t(s.value)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ul>
      <FormFeedback state={state} t={t} />
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-4">
        <Button type="submit" size="lg" className="w-full md:w-auto" disabled={pending} aria-busy={pending}>
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
