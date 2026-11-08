import "server-only";
import { createClient } from "@/lib/supabase/server";
import { cleanSearchTerm } from "@/server/validation";

export type ClassDTO = { id: string; grade: string; section: string };
export type RegisterRowDTO = {
  enrollmentId: string;
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
    .select("enrollment_id, roll_no, full_name, student_no, grade, section, guardian_name, guardian_phone")
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
    rollNo: r.roll_no,
    fullName: r.full_name,
    studentNo: r.student_no,
    classLabel: `${r.grade} ${r.section}`,
    guardianName: r.guardian_name,
    guardianPhone: r.guardian_phone,
  }));
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
