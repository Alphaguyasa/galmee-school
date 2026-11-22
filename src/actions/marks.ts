"use server";

import { revalidatePath } from "next/cache";
import { currentSchoolYear } from "@/lib/school-year";
import { createSubject, getSubject, queueReportCardNotices, saveMarks } from "@/server/dal/marks";
import { getSession } from "@/server/dal/session";
import { formToObject, marksEntriesSchema, marksFormSchema, reportCardNoticeSchema, subjectSchema } from "@/server/validation";
import type { FormState } from "./auth";

const MARK_PREFIX = "mark_";

export async function addSubjectAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await getSession();
  if (profile.role === "staff") return { error: "errorRole" };

  const parsed = subjectSchema.safeParse(formToObject(formData, ["name", "grade", "maxMark"]));
  if (!parsed.success) return { error: "errorSubject" };

  const { ok } = await createSubject({ ...parsed.data, grade: parsed.data.grade || null });
  if (!ok) return { error: "errorSave" };
  revalidatePath("/marks", "layout");
  return { info: "subjectAdded" };
}

export async function saveMarksAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await getSession();

  const form = marksFormSchema.safeParse(formToObject(formData, ["subjectId", "term"]));
  if (!form.success) return { error: "errorSave" };

  const entries = marksEntriesSchema.safeParse(
    [...formData.entries()]
      .filter(([k, v]) => k.startsWith(MARK_PREFIX) && typeof v === "string" && v.trim() !== "")
      .map(([k, mark]) => ({ enrollmentId: k.slice(MARK_PREFIX.length), mark })),
  );
  if (!entries.success) return { error: "errorMark" };

  // RLS limits the subject to this school; the out-of-range check needs its maximum.
  const subject = await getSubject(form.data.subjectId);
  if (!subject) return { error: "errorSave" };
  if (entries.data.some((e) => e.mark > subject.maxMark)) return { error: "errorMark" };

  const { ok, locked } = await saveMarks(subject.id, form.data.term, entries.data);
  if (!ok) return { error: "errorSave" };
  revalidatePath("/marks");
  return { info: locked > 0 ? "savedSomeLocked" : "saved" };
}

export type NoticeState =
  | { error: string }
  | { telegram: number; sms: number; noContact: number; already: number; noMarks: number }
  | undefined;

export async function notifyReportCardsAction(_prev: NoticeState, formData: FormData): Promise<NoticeState> {
  const { profile } = await getSession();
  if (profile.role !== "owner" && profile.role !== "manager") return { error: "errorRole" };

  const parsed = reportCardNoticeSchema.safeParse(formToObject(formData, ["classId", "term"]));
  if (!parsed.success) return { error: "errorSave" };

  const result = await queueReportCardNotices(parsed.data.classId, currentSchoolYear(), parsed.data.term);
  if (!result.ok) return { error: result.reason === "forbidden" ? "errorRole" : "errorNotify" };
  return {
    telegram: result.telegram,
    sms: result.sms,
    noContact: result.noContact,
    already: result.already,
    noMarks: result.noMarks,
  };
}
