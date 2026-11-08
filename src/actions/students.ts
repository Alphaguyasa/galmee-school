"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentSchoolYear } from "@/lib/school-year";
import { getSession } from "@/server/dal/session";
import { addStudent, createClass } from "@/server/dal/students";
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
