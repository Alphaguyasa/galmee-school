import "server-only";
import { createClient } from "@/lib/supabase/server";
import { cleanSearchTerm } from "@/server/validation";

export type ClassDTO = { id: string; grade: string; section: string };
export type RegisterRowDTO = {
  enrollmentId: string;
  studentId: string;
  photoPath: string | null;
  rollNo: number | null;
  fullName: string;
  studentNo: string | null;
  classLabel: string;
  guardianName: string | null;
  guardianPhone: string | null;
};
export type WriteResult = { ok: true } | { ok: false; reason: "duplicate" | "error" };

const REGISTER_LIMIT = 200;

export async function listClasses(): Promise<ClassDTO[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sc_classes")
    .select("id, grade, section")
    .eq("active", true)
    .order("sort_order")
    .order("grade")
    .order("section");
  if (error) throw new Error("Could not load classes");
  return data;
}

/** One class in roll order, or a search across the whole school when `q` is given. */
export async function listRegister(input: {
  year: number;
  classId?: string;
  q?: string;
}): Promise<RegisterRowDTO[]> {
  const supabase = await createClient();
  let query = supabase
    .from("sc_student_register")
    .select("enrollment_id, student_id, roll_no, full_name, student_no, grade, section, guardian_name, guardian_phone, photo_path")
    .eq("academic_year", input.year)
    .eq("status", "active");

  const term = input.q ? cleanSearchTerm(input.q) : "";
  if (term) {
    const compact = term.replace(/[\s-]/g, "");
    query = /^\+?\d+$/.test(compact)
      ? query.or(`guardian_phone.ilike."*${compact}*",student_no.ilike."*${compact}*"`)
      : query.or(`full_name.ilike."*${term}*",student_no.ilike."*${term}*",guardian_name.ilike."*${term}*"`);
    query = query.order("full_name");
  } else if (input.classId) {
    query = query.eq("class_id", input.classId).order("roll_no");
  } else {
    return [];
  }

  const { data, error } = await query.limit(REGISTER_LIMIT);
  if (error) throw new Error("Could not load the register");
  return data.map((r) => ({
    enrollmentId: r.enrollment_id,
    studentId: r.student_id,
    photoPath: r.photo_path,
    rollNo: r.roll_no,
    fullName: r.full_name,
    studentNo: r.student_no,
    classLabel: `${r.grade} ${r.section}`,
    guardianName: r.guardian_name,
    guardianPhone: r.guardian_phone,
  }));
}

export type ParentContactDTO = { guardianId: string; name: string; phone: string; children: string[] };

/** Every parent with a child enrolled this year, children grouped under the parent. */
export async function listParentContacts(year: number): Promise<ParentContactDTO[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sc_student_register")
    .select("guardian_id, guardian_name, guardian_phone, full_name, grade, section")
    .eq("academic_year", year)
    .eq("status", "active")
    .not("guardian_id", "is", null)
    .order("guardian_name")
    .limit(2000);
  if (error) throw new Error("Could not load parent contacts");

  const byGuardian = new Map<string, ParentContactDTO>();
  for (const r of data) {
    if (!r.guardian_id || !r.guardian_name || !r.guardian_phone) continue;
    const entry = byGuardian.get(r.guardian_id) ?? {
      guardianId: r.guardian_id,
      name: r.guardian_name,
      phone: r.guardian_phone,
      children: [],
    };
    entry.children.push(`${r.full_name} (${r.grade} ${r.section})`);
    byGuardian.set(r.guardian_id, entry);
  }
  return [...byGuardian.values()];
}

export async function registerCounts(year: number): Promise<{ students: number; classes: number }> {
  const supabase = await createClient();
  const [students, classes] = await Promise.all([
    supabase
      .from("sc_student_register")
      .select("enrollment_id", { count: "exact", head: true })
      .eq("academic_year", year)
      .eq("status", "active"),
    supabase.from("sc_classes").select("id", { count: "exact", head: true }).eq("active", true),
  ]);
  if (students.error || classes.error) throw new Error("Could not load the counts");
  return { students: students.count ?? 0, classes: classes.count ?? 0 };
}

/** Marks already saved for one class on one day, by enrolment. */
export async function listAttendance(day: string, enrollmentIds: string[]): Promise<Record<string, string>> {
  if (enrollmentIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sc_attendance")
    .select("enrollment_id, status")
    .eq("day", day)
    .in("enrollment_id", enrollmentIds);
  if (error) throw new Error("Could not load attendance");
  return Object.fromEntries(data.map((r) => [r.enrollment_id, r.status]));
}

/** One write for the class; saving the same day again replaces its marks. */
export async function saveAttendance(
  tenantId: string,
  day: string,
  marks: { enrollmentId: string; status: string }[],
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from("sc_attendance").upsert(
    marks.map((m) => ({ tenant_id: tenantId, enrollment_id: m.enrollmentId, day, status: m.status })),
    { onConflict: "tenant_id,enrollment_id,day" },
  );
  return { ok: !error };
}

function toResult(error: { code?: string } | null): WriteResult {
  if (!error) return { ok: true };
  return { ok: false, reason: error.code === "23505" ? "duplicate" : "error" };
}

export async function createClass(input: { grade: string; section: string }): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("sc_classes").insert({ grade: input.grade, section: input.section });
  return toResult(error);
}

export async function addStudent(input: {
  fullName: string;
  gender: "m" | "f";
  studentNo: string;
  classId: string;
  year: number;
  guardianName: string;
  guardianPhone: string;
  relation: string;
}): Promise<WriteResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("sc_add_student", {
    p_full_name: input.fullName,
    p_gender: input.gender,
    p_student_no: input.studentNo,
    p_class: input.classId,
    p_year: input.year,
    p_guardian_name: input.guardianName,
    p_guardian_phone: input.guardianPhone,
    p_relation: input.relation,
  });
  return toResult(error);
}

const PHOTO_BUCKET = "sc-student-photos";
const PHOTO_URL_SECONDS = 60 * 60;

/** Short-lived signed URLs for student photos (the bucket is private), keyed by path. */
export async function signedPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, PHOTO_URL_SECONDS);
  if (error || !data) return {};
  const out: Record<string, string> = {};
  for (const item of data) if (item.path && item.signedUrl) out[item.path] = item.signedUrl;
  return out;
}

/** Records the uploaded photo on the student (owner/manager only, enforced in the database). */
export async function setStudentPhoto(studentId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("sc_set_student_photo", { p_student_id: studentId });
  return !error;
}
