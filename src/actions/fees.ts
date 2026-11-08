"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createFeePlan, generateInvoices, recordPayment } from "@/server/dal/fees";
import { getSession } from "@/server/dal/session";
import { feePlanSchema, formToObject, generateSchema, paymentSchema } from "@/server/validation";
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

export async function recordPaymentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await getSession();

  const parsed = paymentSchema.safeParse(
    formToObject(formData, ["invoiceId", "amount", "method", "reference", "clientRef"]),
  );
  if (!parsed.success) return { error: "errorAmount" };

  const result = await recordPayment(parsed.data);
  if (!result.ok) {
    return { error: result.reason === "overpayment" ? "errorOverpayment" : "errorPayment" };
  }
  revalidatePath("/fees", "layout");
  redirect(`/fees/receipts/${result.receiptId}`);
}
