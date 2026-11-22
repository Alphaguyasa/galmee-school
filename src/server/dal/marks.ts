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

export type SaveCounts = { ok: boolean; locked: number };

/**
 * One call for the class. New marks are saved; a saved mark is only changed when the
 * caller is the owner or a manager (the database counts the others as `locked`).
 */
export async function saveMarks(
  subjectId: string,
  term: number,
  marks: { enrollmentId: string; mark: number }[],
): Promise<SaveCounts> {
  if (marks.length === 0) return { ok: true, locked: 0 };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sc_save_marks", {
    p_subject: subjectId,
    p_term: term,
    p_marks: marks.map((m) => ({ enrollment_id: m.enrollmentId, mark: m.mark })),
  });
  if (error) return { ok: false, locked: 0 };
  return { ok: true, locked: Number((data as { locked?: number } | null)?.locked ?? 0) };
}

export type TermRankDTO = { total: number; average: number; rank: number; classSize: number };

/** Every mark of a class for one term: enrolment → subject → mark. */
export async function listClassTermMarks(term: number, enrollmentIds: string[]): Promise<Record<string, Record<string, number>>> {
  if (enrollmentIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sc_grades")
    .select("enrollment_id, subject_id, mark")
    .eq("term", term)
    .in("enrollment_id", enrollmentIds);
  if (error) throw new Error("Could not load marks");
  const out: Record<string, Record<string, number>> = {};
  for (const r of data) (out[r.enrollment_id] ??= {})[r.subject_id] = Number(r.mark);
  return out;
}

/** Total, average and rank in class for one term (computed by the `sc_class_term_ranks` view). */
export async function listClassTermRanks(classId: string, year: number, term: number): Promise<Record<string, TermRankDTO>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sc_class_term_ranks")
    .select("enrollment_id, total, average, class_rank, class_size")
    .eq("class_id", classId)
    .eq("academic_year", year)
    .eq("term", term);
  if (error) throw new Error("Could not load ranks");
  return Object.fromEntries(
    data.map((r) => [
      r.enrollment_id,
      { total: Number(r.total), average: Number(r.average), rank: Number(r.class_rank), classSize: Number(r.class_size) },
    ]),
  );
}

export type ReportCardNoticeResult =
  | { ok: true; telegram: number; sms: number; noContact: number; already: number; noMarks: number }
  | { ok: false; reason: "forbidden" | "error" };

/**
 * Tell parents that a class's report cards for a term are ready (owner/manager only):
 * Telegram when the parent's chat is linked, otherwise SMS. The database tells each
 * student's parent at most once per term, so repeating only reaches late marks.
 */
export async function queueReportCardNotices(classId: string, year: number, term: number): Promise<ReportCardNoticeResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sc_queue_report_card_notices", {
    p_class_id: classId,
    p_year: year,
    p_term: term,
  });
  if (error) return { ok: false, reason: error.code === "42501" ? "forbidden" : "error" };
  const r = data as { telegram: number; sms: number; no_contact: number; already: number; no_marks: number };
  return { ok: true, telegram: r.telegram, sms: r.sms, noContact: r.no_contact, already: r.already, noMarks: r.no_marks };
}
