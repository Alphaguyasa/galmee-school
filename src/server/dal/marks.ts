import "server-only";
import { createClient } from "@/lib/supabase/server";

export type SubjectDTO = { id: string; name: string; grade: string | null; maxMark: number };

/** Subjects for every grade, or only those taught in `grade` (plus the all-grades ones). */
export async function listSubjects(grade?: string): Promise<SubjectDTO[]> {
  const supabase = await createClient();
  let query = supabase.from("sc_subjects").select("id, name, grade, max_mark").order("sort_order").order("name");
  if (grade !== undefined) query = query.or(`grade.is.null,grade.eq."${grade.replace(/["\\]/g, "")}"`);
  const { data, error } = await query;
  if (error) throw new Error("Could not load subjects");
  return data.map((s) => ({ id: s.id, name: s.name, grade: s.grade, maxMark: Number(s.max_mark) }));
}

export async function createSubject(input: { name: string; grade: string | null; maxMark: number }): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sc_subjects")
    .insert({ name: input.name, grade: input.grade, max_mark: input.maxMark });
  return { ok: !error };
}

export async function getSubject(id: string): Promise<SubjectDTO | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("sc_subjects").select("id, name, grade, max_mark").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return { id: data.id, name: data.name, grade: data.grade, maxMark: Number(data.max_mark) };
}

/** Marks already entered for one subject and term, by enrolment. */
export async function listMarks(subjectId: string, term: number, enrollmentIds: string[]): Promise<Record<string, number>> {
  if (enrollmentIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sc_grades")
    .select("enrollment_id, mark")
    .eq("subject_id", subjectId)
    .eq("term", term)
    .in("enrollment_id", enrollmentIds);
  if (error) throw new Error("Could not load marks");
  return Object.fromEntries(data.map((r) => [r.enrollment_id, Number(r.mark)]));
}

/** One write for the class; saving again replaces the marks of the same subject and term. */
export async function saveMarks(
  tenantId: string,
  subjectId: string,
  term: number,
  marks: { enrollmentId: string; mark: number }[],
): Promise<{ ok: boolean }> {
  if (marks.length === 0) return { ok: true };
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("sc_grades").upsert(
    marks.map((m) => ({ tenant_id: tenantId, enrollment_id: m.enrollmentId, subject_id: subjectId, term, mark: m.mark, updated_at: now })),
    { onConflict: "tenant_id,enrollment_id,subject_id,term" },
  );
  return { ok: !error };
}
