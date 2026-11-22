"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createFeePlan, generateInvoices, queueFeeReminders } from "@/server/dal/fees";
import { getSession } from "@/server/dal/session";
import { feePlanSchema, formToObject, generateSchema, reminderSchema } from "@/server/validation";
import type { FormState } from "./auth";

export async function addFeePlanAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await getSession();
  if (profile.role === "staff") return { error: "errorRole" };

  const parsed = feePlanSchema.safeParse(formToObject(formData, ["name", "grade", "period", "amount"]));
  if (!parsed.success) return { error: "errorPlan" };

  const { ok } = await createFeePlan({ ...parsed.data, grade: parsed.data.grade || null });
  if (!ok) return { error: "errorSave" };
  revalidatePath("/fees", "layout");
  return { info: "planAdded" };
}

export async function generateInvoicesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { profile } = await getSession();
  if (profile.role === "staff") return { error: "errorRole" };

  const parsed = generateSchema.safeParse(formToObject(formData, ["period"]));
  if (!parsed.success) return { error: "errorSave" };

  const result = await generateInvoices(parsed.data.period);
  if (!result.ok) return { error: "errorSave" };
  revalidatePath("/fees", "layout");
  redirect(`/fees?period=${parsed.data.period.key}&generated=${result.count}`);
}

export type ReminderState =
  | { error: string }
  | { queued: number; noPhone: number; alreadyToday: number }
  | undefined;

export async function sendRemindersAction(_prev: ReminderState, formData: FormData): Promise<ReminderState> {
  const { profile } = await getSession();
  if (profile.role !== "owner" && profile.role !== "manager") return { error: "errorRole" };

  const parsed = reminderSchema.safeParse(formToObject(formData, ["classId", "period"]));
  if (!parsed.success) return { error: "errorSave" };

  const result = await queueFeeReminders(parsed.data.classId, parsed.data.period);
  if (!result.ok) return { error: result.reason === "forbidden" ? "errorRole" : "errorReminders" };
  return { queued: result.queued, noPhone: result.noPhone, alreadyToday: result.alreadyToday };
}
