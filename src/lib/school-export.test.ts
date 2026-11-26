import { describe, expect, it } from "vitest";
import am from "../../messages/am.json";
import en from "../../messages/en.json";
import om from "../../messages/om.json";
import { schoolExportSheets, type SchoolExportInput } from "./school-export";

const table = (rows: Record<string, unknown>[], truncated = false) => ({ rows, truncated });

/** Looks keys up in the English messages, with {cap}-style values, like next-intl does. */
function t(key: string, values?: Record<string, string | number>): string {
  const found = key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], en.export);
  if (typeof found !== "string") throw new Error(`missing export.${key}`);
  return found.replace(/\{(\w+)\}/g, (_, k) => String(values?.[k] ?? ""));
}

const data: SchoolExportInput = {
  tenantName: "Bright Future School",
  classes: table([{ id: "c1", grade: "3", section: "A", sort_order: 3, active: true, created_at: "2026-09-10T08:00:00Z" }]),
  guardians: table([
    { id: "g1", full_name: "Tolosa B.", phone: "0911000000", relation: "father", telegram_chat_id: 12345, created_at: "2026-09-10T08:00:00Z" },
    { id: "g2", full_name: "=HYPERLINK(\"x\")", phone: null, relation: "aunt", telegram_chat_id: null, created_at: "2026-09-10T08:00:00Z" },
  ]),
  students: table([
    { id: "s1", student_no: "S-001", full_name: "Chaltu T.", gender: "f", date_of_birth: "2018-03-01", status: "active", guardian_id: "g1", created_at: "2026-09-10T08:00:00Z" },
    { id: "s2", student_no: null, full_name: "Abel K.", gender: null, date_of_birth: null, status: "left", guardian_id: null, created_at: "2026-09-11T08:00:00Z" },
  ]),
  enrollments: table([{ id: "e1", student_id: "s1", class_id: "c1", academic_year: 2019, roll_no: 7, created_at: "2026-09-10T08:00:00Z" }]),
  feePlans: table([{ id: "p1", name: "Grade 3 monthly", grade: "3", period: "monthly", amount: "800.00", active: true, created_at: "2026-09-10T08:00:00Z" }]),
  invoices: table([
    { id: "i1", enrollment_id: "e1", fee_plan_id: "p1", period_key: "2019-03", description: "Hidar", amount: 800, paid: "300.5", due_date: "2026-11-30", status: "partial", created_at: "2026-11-10T08:00:00Z" },
  ]),
  receipts: table([
    { id: "r1", invoice_id: "i1", payment_id: "pay1", receipt_no: "SC-000001", amount: 300.5, method: "telebirr", client_ref: "ref-1", received_by: "u1", created_at: "2026-11-12T08:00:00Z" },
  ]),
  subjects: table([{ id: "sub1", name: "Maths", grade: "3", max_mark: 100, sort_order: 1, created_at: "2026-09-10T08:00:00Z" }]),
  marks: table([{ id: "m1", enrollment_id: "e1", subject_id: "sub1", term: 1, mark: 87.5, updated_at: "2026-11-20T08:00:00Z" }]),
  attendance: table([{ id: "a1", enrollment_id: "e1", day: "2026-11-24", status: "absent", created_at: "2026-11-24T05:00:00Z" }], true),
  staff: table([{ user_id: "u1", full_name: "Hana M.", role: "manager" }]),
};

const sheets = schoolExportSheets(data, t, "2026-11-26T12:00:00Z", 50000);
const sheet = (name: string) => sheets.find((s) => s.name === name)!.rows;

describe("schoolExportSheets", () => {
  it("starts with an About sheet, then one sheet per kind of record", () => {
    expect(sheets.map((s) => s.name)).toEqual([
      "About", "Students", "Parents", "Classes", "Enrollments", "Fee plans", "Fees", "Receipts", "Subjects", "Marks", "Attendance", "Staff",
    ]);
    const about = sheet("About");
    expect(about[1]).toEqual(["School", "Bright Future School"]);
    expect(about).toContainEqual(["Students", 2, null]);
    expect(about).toContainEqual(["Attendance", 1, "Only the first 50000 rows; ask for a full copy"]);
  });

  it("every row has as many cells as its header", () => {
    for (const s of sheets.slice(1)) for (const row of s.rows) expect(row.length).toBe(s.rows[0].length);
  });

  it("puts the parent beside each student and writes codes as words", () => {
    const [, chaltu, abel] = sheet("Students");
    expect(chaltu).toEqual(["s1", "S-001", "Chaltu T.", "Female", "2018-03-01", "Active", "Tolosa B.", "0911000000", "g1", "2026-09-10T08:00:00Z"]);
    expect(abel.slice(3, 9)).toEqual([null, null, "Left", null, null, null]);
  });

  it("keeps unknown codes as stored and never leaks the Telegram chat id", () => {
    const parents = sheet("Parents");
    expect(parents[1]).toEqual(["g1", "Tolosa B.", "0911000000", "Father", "Yes", "2026-09-10T08:00:00Z"]);
    expect(parents[2][3]).toBe("aunt");
    expect(parents[2][4]).toBe("No");
    expect(parents.flat()).not.toContain(12345);
    expect(parents.flat()).not.toContain("12345");
  });

  it("gives fees as numbers with what is still owed, and names on receipts", () => {
    const fee = sheet("Fees")[1];
    expect(fee).toEqual(["i1", "Chaltu T.", "3 A", 2019, "2019-03", "Hidar", "Grade 3 monthly", 800, 300.5, 499.5, "2026-11-30", "Partly paid", "2026-11-10T08:00:00Z"]);
    const receipt = sheet("Receipts")[1];
    expect(receipt).toEqual(["SC-000001", "2026-11-12T08:00:00Z", "Chaltu T.", "3 A", "Hidar", 300.5, "Telebirr", "Hana M.", "i1", "pay1", "ref-1"]);
  });

  it("names the student, class and subject on marks and attendance", () => {
    expect(sheet("Marks")[1]).toEqual(["Chaltu T.", "3 A", 2019, "Maths", 1, 87.5, 100, "2026-11-20T08:00:00Z"]);
    expect(sheet("Attendance")[1]).toEqual(["2026-11-24", "Chaltu T.", "3 A", 2019, "Absent"]);
    expect(sheet("Staff")[1]).toEqual(["Hana M.", "Manager"]);
  });

  it("has the same export keys in every language", () => {
    const keys = (node: unknown, prefix = ""): string[] =>
      typeof node === "string"
        ? [prefix]
        : Object.entries(node as Record<string, unknown>).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
    const english = keys(en.export).sort();
    expect(keys(am.export).sort()).toEqual(english);
    expect(keys(om.export).sort()).toEqual(english);
  });
});
