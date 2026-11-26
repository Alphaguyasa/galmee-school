import type { XlsxCell, XlsxSheet } from "@/lib/xlsx";

type Row = Record<string, unknown>;
type Table = { rows: Row[]; truncated: boolean };

export type SchoolExportInput = {
  tenantName: string;
  classes: Table;
  guardians: Table;
  students: Table;
  enrollments: Table;
  feePlans: Table;
  invoices: Table;
  receipts: Table;
  subjects: Table;
  marks: Table;
  attendance: Table;
  staff: Table;
};

/** Translator for keys under `export` (sheet.*, col.*, about.*, value.*, yes, no). */
export type ExportT = (key: string, values?: Record<string, string | number>) => string;

const text = (v: unknown): XlsxCell => (v === null || v === undefined ? null : String(v));
const num = (v: unknown): XlsxCell => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};
const money = (v: unknown): XlsxCell => {
  const n = num(v);
  return typeof n === "number" ? Math.round(n * 100) / 100 : null;
};

function index(rows: Row[], key: string): Map<string, Row> {
  return new Map(rows.map((r) => [String(r[key]), r]));
}

/** Stored codes that have a word in every language; anything else is written as stored. */
const VALUE_KEYS: Record<string, readonly string[]> = {
  gender: ["m", "f"],
  studentStatus: ["active", "left", "graduated"],
  relation: ["parent", "mother", "father", "guardian", "other"],
  period: ["monthly", "term", "annual"],
  invoiceStatus: ["paid", "partial", "unpaid"],
  attendance: ["present", "absent", "late", "excused"],
  method: ["cash", "telebirr", "cbe_birr", "chapa", "bank", "other"],
  role: ["owner", "manager", "staff"],
};

/**
 * The owner's full export as workbook sheets: one sheet per kind of record, with student,
 * class and subject names beside their ids so the file reads without the app, and an "About"
 * sheet first that says when it was made and whether any sheet hit the row cap.
 */
export function schoolExportSheets(data: SchoolExportInput, t: ExportT, exportedAt: string, rowCap: number): XlsxSheet[] {
  const yesNo = (v: unknown): XlsxCell => (v === null || v === undefined ? null : v ? t("yes") : t("no"));
  const word = (kind: keyof typeof VALUE_KEYS, v: unknown): XlsxCell => {
    if (v === null || v === undefined || v === "") return null;
    return VALUE_KEYS[kind].includes(String(v)) ? t(`value.${kind}.${String(v)}`) : String(v);
  };

  const classes = index(data.classes.rows, "id");
  const guardians = index(data.guardians.rows, "id");
  const students = index(data.students.rows, "id");
  const enrollments = index(data.enrollments.rows, "id");
  const plans = index(data.feePlans.rows, "id");
  const invoices = index(data.invoices.rows, "id");
  const subjects = index(data.subjects.rows, "id");
  const staff = index(data.staff.rows, "user_id");

  const classLabel = (id: unknown): XlsxCell => {
    const c = id === null || id === undefined ? undefined : classes.get(String(id));
    return c ? `${String(c.grade ?? "")} ${String(c.section ?? "")}`.trim() : null;
  };
  const studentName = (id: unknown): XlsxCell => (id ? text(students.get(String(id))?.full_name) : null);
  /** Student name, class and school year of an enrollment. */
  const enrolled = (id: unknown): [XlsxCell, XlsxCell, XlsxCell] => {
    const e = id === null || id === undefined ? undefined : enrollments.get(String(id));
    if (!e) return [null, null, null];
    return [studentName(e.student_id), classLabel(e.class_id), num(e.academic_year)];
  };
  const head = (...keys: string[]) => keys.map((k) => t(`col.${k}`));

  const sheets: { key: string; table: Table; rows: XlsxCell[][] }[] = [
    {
      key: "students",
      table: data.students,
      rows: [
        head("id", "studentNo", "name", "gender", "birthDate", "status", "parent", "parentPhone", "parentId", "created"),
        ...data.students.rows.map((r) => {
          const g = r.guardian_id ? guardians.get(String(r.guardian_id)) : undefined;
          return [
            text(r.id), text(r.student_no), text(r.full_name), word("gender", r.gender), text(r.date_of_birth), word("studentStatus", r.status),
            text(g?.full_name), text(g?.phone), text(r.guardian_id), text(r.created_at),
          ];
        }),
      ],
    },
    {
      key: "parents",
      table: data.guardians,
      rows: [
        head("id", "name", "phone", "relation", "telegram", "created"),
        ...data.guardians.rows.map((r) => [
          text(r.id), text(r.full_name), text(r.phone), word("relation", r.relation), yesNo(Boolean(r.telegram_chat_id)), text(r.created_at),
        ]),
      ],
    },
    {
      key: "classes",
      table: data.classes,
      rows: [
        head("id", "class", "grade", "section", "active", "created"),
        ...data.classes.rows.map((r) => [text(r.id), classLabel(r.id), text(r.grade), text(r.section), yesNo(r.active), text(r.created_at)]),
      ],
    },
    {
      key: "enrollments",
      table: data.enrollments,
      rows: [
        head("id", "student", "studentId", "class", "classId", "year", "rollNo", "created"),
        ...data.enrollments.rows.map((r) => [
          text(r.id), studentName(r.student_id), text(r.student_id), classLabel(r.class_id), text(r.class_id),
          num(r.academic_year), num(r.roll_no), text(r.created_at),
        ]),
      ],
    },
    {
      key: "feePlans",
      table: data.feePlans,
      rows: [
        head("id", "name", "grade", "period", "amount", "active", "created"),
        ...data.feePlans.rows.map((r) => [
          text(r.id), text(r.name), text(r.grade), word("period", r.period), money(r.amount), yesNo(r.active), text(r.created_at),
        ]),
      ],
    },
    {
      key: "invoices",
      table: data.invoices,
      rows: [
        head("id", "student", "class", "year", "periodKey", "description", "feePlan", "amount", "paid", "remaining", "due", "status", "created"),
        ...data.invoices.rows.map((r) => {
          const amount = money(r.amount);
          const paid = money(r.paid);
          const remaining =
            typeof amount === "number" && typeof paid === "number" ? Math.max(0, Math.round((amount - paid) * 100) / 100) : null;
          return [
            text(r.id), ...enrolled(r.enrollment_id), text(r.period_key), text(r.description),
            r.fee_plan_id ? text(plans.get(String(r.fee_plan_id))?.name) : null,
            amount, paid, remaining, text(r.due_date), word("invoiceStatus", r.status), text(r.created_at),
          ];
        }),
      ],
    },
    {
      key: "receipts",
      table: data.receipts,
      rows: [
        head("receiptNo", "created", "student", "class", "forFee", "amount", "method", "receivedBy", "invoiceId", "paymentId", "clientRef"),
        ...data.receipts.rows.map((r) => {
          const inv = r.invoice_id ? invoices.get(String(r.invoice_id)) : undefined;
          const [student, cls] = enrolled(inv?.enrollment_id);
          return [
            text(r.receipt_no), text(r.created_at), student, cls, text(inv?.description), money(r.amount), word("method", r.method),
            r.received_by ? text(staff.get(String(r.received_by))?.full_name) : null, text(r.invoice_id), text(r.payment_id), text(r.client_ref),
          ];
        }),
      ],
    },
    {
      key: "subjects",
      table: data.subjects,
      rows: [
        head("id", "name", "grade", "maxMark", "created"),
        ...data.subjects.rows.map((r) => [text(r.id), text(r.name), text(r.grade), num(r.max_mark), text(r.created_at)]),
      ],
    },
    {
      key: "marks",
      table: data.marks,
      rows: [
        head("student", "class", "year", "subject", "term", "mark", "maxMark", "updated"),
        ...data.marks.rows.map((r) => {
          const s = r.subject_id ? subjects.get(String(r.subject_id)) : undefined;
          return [...enrolled(r.enrollment_id), text(s?.name), num(r.term), num(r.mark), num(s?.max_mark), text(r.updated_at)];
        }),
      ],
    },
    {
      key: "attendance",
      table: data.attendance,
      rows: [
        head("day", "student", "class", "year", "status"),
        ...data.attendance.rows.map((r) => [text(r.day), ...enrolled(r.enrollment_id), word("attendance", r.status)]),
      ],
    },
    {
      key: "staff",
      table: data.staff,
      rows: [head("name", "role"), ...data.staff.rows.map((r) => [text(r.full_name), word("role", r.role)])],
    },
  ];

  const about: XlsxCell[][] = [
    [t("about.field"), t("about.value")],
    [t("about.business"), data.tenantName],
    [t("about.exportedAt"), exportedAt],
    [t("about.dates"), t("about.datesNote")],
    [],
    [t("about.sheet"), t("about.rows")],
    ...sheets.map((s) => [t(`sheet.${s.key}`), s.rows.length - 1, s.table.truncated ? t("about.truncated", { cap: rowCap }) : null]),
  ];

  return [{ name: t("sheet.about"), rows: about }, ...sheets.map((s) => ({ name: t(`sheet.${s.key}`), rows: s.rows }))];
}
