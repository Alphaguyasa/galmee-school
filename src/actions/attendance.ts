"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/server/dal/session";
import { saveAttendance } from "@/server/dal/students";
import { attendanceDaySchema, attendanceMarksSchema } from "@/server/validation";
import type { FormState } from "./auth";

const MARK_PREFIX = "mark_";

export async function saveAttendanceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await getSession();

  const day = attendanceDaySchema.safeParse(formData.get("day"));
  if (!day.success) return { error: "errorDay" };

  const marks = attendanceMarksSchema.safeParse(
    [...formData.entries()]
      .filter(([k]) => k.startsWith(MARK_PREFIX))
      .map(([k, status]) => ({ enrollmentId: k.slice(MARK_PREFIX.length), status })),
  );
  if (!marks.success) return { error: "errorSave" };

  // The database function checks the school, the enrolment and who may change a past day.
  const { ok, locked } = await saveAttendance(day.data, marks.data);
  if (!ok) return { error: "errorSave" };
  revalidatePath("/attendance");
  return { info: locked > 0 ? "savedSomeLocked" : "saved" };
}
