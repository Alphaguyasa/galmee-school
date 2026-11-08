import { z } from "zod";

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
