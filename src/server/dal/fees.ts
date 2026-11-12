import "server-only";
import { sumMoney } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export type FeePlanDTO = { id: string; name: string; grade: string | null; period: string; amount: number };
export type ClassUnpaidDTO = {
  classId: string;
  classLabel: string;
  periodKey: string;
  students: number;
  unpaidStudents: number;
  owed: number;
};
export type InvoiceRowDTO = {
  invoiceId: string;
  rollNo: number | null;
  fullName: string;
  guardianPhone: string | null;
  description: string;
  amount: number;
  remaining: number;
  status: string;
};
export type InvoiceDetailDTO = InvoiceRowDTO & { classLabel: string; periodKey: string; classId: string };
export type ReceiptDTO = {
  receiptNo: number;
  amount: number;
  method: string;
  createdAt: string;
  fullName: string;
  classLabel: string;
  description: string;
  periodKey: string;
  invoiceId: string;
  /** Still owed on the invoice right after this payment. */
  remaining: number;
};

export async function listFeePlans(): Promise<FeePlanDTO[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sc_fee_plans")
    .select("id, name, grade, period, amount")
    .eq("active", true)
    .order("name");
  if (error) throw new Error("Could not load fee plans");
  return data;
}

export async function createFeePlan(input: {
  name: string;
  grade: string | null;
  period: string;
  amount: number;
}): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from("sc_fee_plans").insert(input);
  return { ok: !error };
}

/** Per class and period for one school year; `sc_unpaid_by_class` runs under RLS. */
export async function listUnpaidByClass(year: number): Promise<ClassUnpaidDTO[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sc_unpaid_by_class")
    .select("class_id, grade, section, sort_order, period_key, students, unpaid_students, owed")
    .like("period_key", `${year}%`)
    .order("sort_order")
    .order("grade")
    .order("section");
  if (error) throw new Error("Could not load unpaid fees");
  return data.map((r) => ({
    classId: r.class_id!,
    classLabel: `${r.grade} ${r.section}`,
    periodKey: r.period_key!,
    students: r.students ?? 0,
    unpaidStudents: r.unpaid_students ?? 0,
    owed: Number(r.owed ?? 0),
  }));
}

export async function generateInvoices(input: {
  year: number;
  type: string;
  key: string;
}): Promise<{ ok: true; count: number } | { ok: false }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sc_generate_invoices", {
    p_academic_year: input.year,
    p_period: input.type,
    p_period_key: input.key,
  });
  return error ? { ok: false } : { ok: true, count: data };
}

export async function listClassInvoices(classId: string, periodKey: string): Promise<InvoiceRowDTO[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sc_invoice_register")
    .select("invoice_id, roll_no, full_name, guardian_phone, description, amount, remaining, status")
    .eq("class_id", classId)
    .eq("period_key", periodKey)
    .order("roll_no");
  if (error) throw new Error("Could not load invoices");
  return data.map((r) => ({
    invoiceId: r.invoice_id,
    rollNo: r.roll_no,
    fullName: r.full_name,
    guardianPhone: r.guardian_phone,
    description: r.description,
    amount: Number(r.amount),
    remaining: Number(r.remaining),
    status: r.status,
  }));
}

export async function getInvoice(invoiceId: string): Promise<InvoiceDetailDTO | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sc_invoice_register")
    .select("invoice_id, roll_no, full_name, guardian_phone, description, amount, remaining, status, grade, section, period_key, class_id")
    .eq("invoice_id", invoiceId)
    .maybeSingle();
  if (error) throw new Error("Could not load the invoice");
  if (!data) return null;
  return {
    invoiceId: data.invoice_id,
    rollNo: data.roll_no,
    fullName: data.full_name,
    guardianPhone: data.guardian_phone,
    description: data.description,
    amount: Number(data.amount),
    remaining: Number(data.remaining),
    status: data.status,
    classLabel: `${data.grade} ${data.section}`,
    periodKey: data.period_key,
    classId: data.class_id,
  };
}

export type PaymentResult =
  | { ok: true; receiptId: string }
  | { ok: false; reason: "overpayment" | "not_found" | "error" };

export async function recordPayment(input: {
  invoiceId: string;
  amount: number;
  method: "cash" | "telebirr" | "cbe_birr" | "bank" | "other";
  reference: string;
  clientRef: string;
}): Promise<PaymentResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sc_record_fee_payment", {
    p_invoice: input.invoiceId,
    p_amount: input.amount,
    p_method: input.method,
    p_reference: input.reference || undefined,
    p_client_ref: input.clientRef,
  });
  if (error) {
    if (error.message.includes("overpayment")) return { ok: false, reason: "overpayment" };
    if (error.message.includes("invoice_not_found")) return { ok: false, reason: "not_found" };
    return { ok: false, reason: "error" };
  }
  return { ok: true, receiptId: (data as { receipt_id: string }).receipt_id };
}

export type InvoiceReceiptDTO = { receiptId: string; receiptNo: number; amount: number; createdAt: string };

/** Every receipt issued against one invoice, oldest first (for reprints). */
export async function listInvoiceReceipts(invoiceId: string): Promise<InvoiceReceiptDTO[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sc_receipt_details")
    .select("receipt_id, receipt_no, amount, created_at")
    .eq("invoice_id", invoiceId)
    .order("receipt_no");
  if (error) throw new Error("Could not load the receipts");
  return data.map((r) => ({
    receiptId: r.receipt_id!,
    receiptNo: r.receipt_no!,
    amount: Number(r.amount),
    createdAt: r.created_at!,
  }));
}

export async function getReceipt(receiptId: string): Promise<ReceiptDTO | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sc_receipt_details")
    .select("receipt_no, amount, method, created_at, full_name, grade, section, description, period_key, invoice_id, invoice_amount")
    .eq("receipt_id", receiptId)
    .maybeSingle();
  if (error) throw new Error("Could not load the receipt");
  if (!data) return null;
  // A reprint shows what was still owed right after this payment, not today's balance.
  const earlier = await listInvoiceReceipts(data.invoice_id!);
  const paidUpToHere = sumMoney(earlier.filter((r) => r.receiptNo <= data.receipt_no!).map((r) => r.amount));
  return {
    receiptNo: data.receipt_no!,
    amount: Number(data.amount),
    method: data.method!,
    createdAt: data.created_at!,
    fullName: data.full_name!,
    classLabel: `${data.grade} ${data.section}`,
    description: data.description!,
    periodKey: data.period_key!,
    invoiceId: data.invoice_id!,
    remaining: Math.max(0, sumMoney([Number(data.invoice_amount), -paidUpToHere])),
  };
}
