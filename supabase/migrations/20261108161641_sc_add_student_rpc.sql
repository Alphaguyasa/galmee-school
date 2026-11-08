-- Registers a student, links or creates the parent by phone, and enrols them with the next roll number.
create or replace function public.sc_add_student(p_full_name text, p_gender text, p_student_no text, p_class uuid, p_year integer, p_guardian_name text, p_guardian_phone text, p_relation text default 'parent')
returns uuid language plpgsql security invoker set search_path = public, private as $$
declare v_tenant uuid := private.current_tenant(); v_guardian uuid; v_student uuid; v_roll integer;
begin
  if v_tenant is null then raise exception 'not_authenticated'; end if;

  insert into public.sc_guardians (full_name, phone, relation)
  values (p_guardian_name, p_guardian_phone, coalesce(p_relation, 'parent'))
  on conflict (tenant_id, phone) do update set full_name = excluded.full_name
  returning id into v_guardian;

  insert into public.sc_students (full_name, gender, student_no, guardian_id)
  values (p_full_name, p_gender, nullif(p_student_no, ''), v_guardian)
  returning id into v_student;

  perform pg_advisory_xact_lock(hashtextextended('sc_roll:' || p_class::text, p_year));
  select coalesce(max(roll_no), 0) + 1 into v_roll from public.sc_enrollments
  where tenant_id = v_tenant and class_id = p_class and academic_year = p_year;

  insert into public.sc_enrollments (student_id, class_id, academic_year, roll_no)
  values (v_student, p_class, p_year, v_roll);
  return v_student;
end $$;

revoke all on function public.sc_add_student(text, text, text, uuid, integer, text, text, text) from public, anon;
grant execute on function public.sc_add_student(text, text, text, uuid, integer, text, text, text) to authenticated;
