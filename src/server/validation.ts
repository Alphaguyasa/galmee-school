import { z } from "zod";
import { addisToday } from "@/lib/school-year";

export const MIN_PASSWORD = 10;

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().max(128),
});

export const signupSchema = credentialsSchema.extend({
  password: z.string().min(MIN_PASSWORD).max(128),
});

// Ethiopian mobile/landline: 09xxxxxxxx, 07xxxxxxxx or +2519xxxxxxxx; spaces and dashes allowed.
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(\+251|0)[1-9]\d{8}$/));

export const onboardingSchema = z.object({
  schoolName: z.string().trim().min(2).max(120),
  fullName: z.string().trim().min(2).max(120),
  phone: phoneSchema,
});

export function formToObject(formData: FormData, keys: readonly string[]) {
  return Object.fromEntries(keys.map((k) => [k, formData.get(k) ?? ""]));
}

const optionalText = (max: number) => z.string().trim().max(max);

export const classSchema = z.object({
  grade: z.string().trim().min(1).max(30),
  section: z.string().trim().min(1).max(10),
});

export const RELATIONS = ["parent", "mother", "father", "guardian", "other"] as const;

export const studentSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  gender: z.enum(["m", "f"]),
  studentNo: optionalText(30),
  classId: z.uuid(),
  guardianName: z.string().trim().min(2).max(120),
  guardianPhone: phoneSchema,
  relation: z.enum(RELATIONS),
});

/** Query string of the register. Bad values fall back to "not set" instead of erroring. */
export const registerQuerySchema = z.object({
  class: z.uuid().optional().catch(undefined),
  q: z.string().trim().max(60).optional().catch(undefined),
});

/** Removes the characters that have meaning in a PostgREST filter value. */
export function cleanSearchTerm(q: string): string {
  return q.replace(/[,()"\\*%:]/g, " ").replace(/\s+/g, " ").trim();
}

const amountSchema = z
  .string()
  .trim()
  .regex(/^\d{1,10}(\.\d{1,2})?$/)
  .transform(Number)
  .refine((n) => n > 0);

export const FEE_PERIODS = ["monthly", "term", "annual"] as const;
export const COUNTER_METHODS = ["cash", "telebirr", "cbe_birr", "bank", "other"] as const;

export const feePlanSchema = z.object({
  name: z.string().trim().min(2).max(80),
  grade: z.string().trim().max(30),
  period: z.enum(FEE_PERIODS),
  amount: amountSchema,
});

export const generateSchema = z.object({
  period: z
    .string()
    .regex(/^(monthly:\d{4}-(0[1-9]|1[0-3])|term:\d{4}-T[1-4]|annual:\d{4})$/)
    .transform((v) => {
      const [type, key] = v.split(":");
      return { type: type as (typeof FEE_PERIODS)[number], key, year: Number(key.slice(0, 4)) };
    }),
});

export const paymentSchema = z.object({
  invoiceId: z.uuid(),
  amount: amountSchema,
  method: z.enum(COUNTER_METHODS),
  reference: z.string().trim().max(60),
  clientRef: z.uuid(),
});

const periodKey = z.string().regex(/^\d{4}(-(0[1-9]|1[0-3]|T[1-4]))?$/);

/** Query string of the fee screens. Bad values fall back to "not set". */
export const feesQuerySchema = z.object({
  period: periodKey.optional().catch(undefined),
  generated: z.coerce.number().int().min(0).optional().catch(undefined),
});

export const uuidParam = z.uuid();

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const ATTENDANCE_STATUSES = ["present", "absent", "late", "excused"] as const;

/** A school day to mark: never in the future (Addis Ababa time). */
export const attendanceDaySchema = isoDay.refine((d) => !Number.isNaN(Date.parse(d)) && d <= addisToday());

/** `mark_<enrollment uuid>` fields of the attendance form, one per student. */
export const attendanceMarksSchema = z
  .array(z.object({ enrollmentId: z.uuid(), status: z.enum(ATTENDANCE_STATUSES) }))
  .min(1)
  .max(300);

export const attendanceQuerySchema = z.object({
  class: z.uuid().optional().catch(undefined),
  day: attendanceDaySchema.optional().catch(undefined),
});

export const TERMS = [1, 2, 3, 4] as const;

const markSchema = z
  .string()
  .trim()
  .regex(/^\d{1,4}(\.\d{1,2})?$/)
  .transform(Number);

export const subjectSchema = z.object({
  name: z.string().trim().min(2).max(80),
  grade: z.string().trim().max(30),
  maxMark: markSchema.refine((n) => n > 0 && n <= 1000),
});

export const marksFormSchema = z.object({
  subjectId: z.uuid(),
  term: z.coerce.number().int().min(1).max(4),
});

/** `mark_<enrollment uuid>` fields of the marks form. Empty fields are skipped, not saved as zero. */
export const marksEntriesSchema = z
  .array(z.object({ enrollmentId: z.uuid(), mark: markSchema }))
  .max(300);

export const marksQuerySchema = z.object({
  class: z.uuid().optional().catch(undefined),
  subject: z.uuid().optional().catch(undefined),
  term: z.coerce.number().int().min(1).max(4).optional().catch(undefined),
});
