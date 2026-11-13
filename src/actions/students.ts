"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentSchoolYear } from "@/lib/school-year";
import { getSession } from "@/server/dal/session";
import { addStudent, createClass, setStudentPhoto } from "@/server/dal/students";
import { z } from "zod";
import { classSchema, formToObject, studentSchema } from "@/server/validation";
import type { FormState } from "./auth";

export async function addClassAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await getSession();
  if (profile.role === "staff") return { error: "errorRole" };

  const parsed = classSchema.safeParse(formToObject(formData, ["grade", "section"]));
  if (!parsed.success) return { error: "errorClassRequired" };

  const result = await createClass(parsed.data);
  if (!result.ok) return { error: result.reason === "duplicate" ? "errorClassDuplicate" : "errorSave" };
  revalidatePath("/students", "layout");
  return { info: "classAdded" };
}

export async function addStudentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await getSession();

  const parsed = studentSchema.safeParse(
    formToObject(formData, ["fullName", "gender", "studentNo", "classId", "guardianName", "guardianPhone", "relation"]),
  );
  if (!parsed.success) {
    const phoneIssue = parsed.error.issues.some((i) => i.path[0] === "guardianPhone");
    return { error: phoneIssue ? "errorPhone" : "errorRequired" };
  }

  const result = await addStudent({ ...parsed.data, year: currentSchoolYear() });
  if (!result.ok) return { error: result.reason === "duplicate" ? "errorStudentNoTaken" : "errorSave" };
  revalidatePath("/students", "layout");
  redirect(`/students/new?class=${parsed.data.classId}&added=${crypto.randomUUID().slice(0, 8)}`);
}

/** Called after the browser uploaded the photo to storage; links it to the student. */
export async function setStudentPhotoAction(studentId: string): Promise<{ ok: boolean }> {
  const { profile } = await getSession();
  if (profile.role === "staff") return { ok: false };
  const id = z.uuid().safeParse(studentId);
  if (!id.success) return { ok: false };
  const ok = await setStudentPhoto(id.data);
  if (ok) revalidatePath("/students/id-cards");
  return { ok };
}
