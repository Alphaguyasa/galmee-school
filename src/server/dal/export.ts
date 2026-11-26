import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "./session";

/** Rows read per request (the API returns at most 1000) and the most read from one table. */
const PAGE = 1000;
export const EXPORT_ROW_CAP = 50_000;

type Table =
  | "sc_classes"
  | "sc_guardians"
  | "sc_students"
  | "sc_enrollments"
  | "sc_fee_plans"
  | "sc_fee_invoices"
  | "sc_fee_receipts"
  | "sc_subjects"
  | "sc_grades"
  | "sc_attendance"
  | "profiles";

type Query = {
  order(column: string): Query;
  range(from: number, to: number): PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
};

export type ExportTable = { rows: Record<string, unknown>[]; truncated: boolean };

export type SchoolExportDTO = {
  tenantName: string;
  classes: ExportTable;
  guardians: ExportTable;
  students: ExportTable;
  enrollments: ExportTable;
  feePlans: ExportTable;
  invoices: ExportTable;
  receipts: ExportTable;
  subjects: ExportTable;
  marks: ExportTable;
  attendance: ExportTable;
  staff: ExportTable;
};

export type ExportResult = { ok: true; data: SchoolExportDTO } | { ok: false; code: "forbidden" | "generic" };

/**
 * Everything this school has in Galmee, for the owner to keep or take elsewhere.
 * Row-level security limits every read to the caller's own school; the owner check is here
 * because the file holds every parent's phone number and every student's marks and fees.
 */
export async function exportSchoolData(): Promise<ExportResult> {
  const session = await getSession();
  if (session.profile.role !== "owner") return { ok: false, code: "forbidden" };
  // Read-only, column lists fixed in this file; a loose builder type covers every table alike.
  const db = (await createClient()) as unknown as { from(table: Table): { select(columns: string): Query } };

  async function readAll(table: Table, columns: string, order: string): Promise<ExportTable> {
    // A unique last sort key keeps pages from repeating or skipping rows.
    const keys = order === "id" || !columns.split(", ").includes("id") ? [order] : [order, "id"];
    const sorted = (q: Query) => keys.reduce((acc, k) => acc.order(k), q);
    const rows: Record<string, unknown>[] = [];
    for (let from = 0; from < EXPORT_ROW_CAP; from += PAGE) {
      const to = Math.min(from + PAGE, EXPORT_ROW_CAP) - 1;
      const { data, error } = await sorted(db.from(table).select(columns)).range(from, to);
      if (error) throw new Error(`export_${table}`);
      const page = (data ?? []) as unknown as Record<string, unknown>[];
      rows.push(...page);
      if (page.length < to - from + 1) return { rows, truncated: false };
    }
    // Exactly at the cap: one more read tells whether anything was left out.
    const { data } = await sorted(db.from(table).select(order)).range(EXPORT_ROW_CAP, EXPORT_ROW_CAP);
    return { rows, truncated: (data ?? []).length > 0 };
  }

  try {
    const [classes, guardians, students, enrollments, feePlans, invoices, receipts, subjects, marks, attendance, staff] =
      await Promise.all([
        readAll("sc_classes", "id, grade, section, sort_order, active, created_at", "sort_order"),
        readAll("sc_guardians", "id, full_name, phone, relation, telegram_chat_id, created_at", "created_at"),
        readAll("sc_students", "id, student_no, full_name, gender, date_of_birth, status, guardian_id, created_at", "created_at"),
        readAll("sc_enrollments", "id, student_id, class_id, academic_year, roll_no, created_at", "created_at"),
        readAll("sc_fee_plans", "id, name, grade, period, amount, active, created_at", "created_at"),
        readAll("sc_fee_invoices", "id, enrollment_id, fee_plan_id, period_key, description, amount, paid, due_date, status, created_at", "created_at"),
        readAll("sc_fee_receipts", "id, invoice_id, payment_id, receipt_no, amount, method, client_ref, received_by, created_at", "created_at"),
        readAll("sc_subjects", "id, name, grade, max_mark, sort_order, created_at", "created_at"),
        readAll("sc_grades", "id, enrollment_id, subject_id, term, mark, updated_at", "updated_at"),
        readAll("sc_attendance", "id, enrollment_id, day, status, created_at", "day"),
        readAll("profiles", "user_id, full_name, role", "user_id"),
      ]);
    return {
      ok: true,
      data: { tenantName: session.tenant.name, classes, guardians, students, enrollments, feePlans, invoices, receipts, subjects, marks, attendance, staff },
    };
  } catch {
    return { ok: false, code: "generic" };
  }
}
