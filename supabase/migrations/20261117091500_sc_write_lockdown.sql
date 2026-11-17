-- School write lockdown: only owners and managers change saved records; marks and attendance go through RPCs.
-- 1. UPDATE on sc_grades, sc_students, sc_attendance, sc_enrollments, sc_guardians: owner/manager only.
-- 2. Marks and attendance are saved through sc_save_marks / sc_save_attendance:
--    - any member may enter a mark or attendance that is not there yet (daily teacher work);
--    - changing a saved mark: owner/manager only (staff get it counted as `locked`, nothing changed);
--    - changing saved attendance: owner/manager, or anyone on the same day (Addis Ababa date).
-- 3. Every change to sc_grades and every change/removal of sc_attendance is written to audit_log.

-- 1. UPDATE policies
do $$
declare t text;
begin
  foreach t in array array['sc_grades','sc_students','sc_attendance','sc_enrollments','sc_guardians'] loop
    execute format('drop policy if exists %I on public.%I', t || '_upd', t);
    execute format($p$create policy %I on public.%I for update to authenticated
      using (tenant_id = (select private.current_tenant())
             and (select private.current_app_role()) = any (array['owner'::user_role, 'manager'::user_role]))
      with check (tenant_id = (select private.current_tenant()))$p$, t || '_upd', t);
  end loop;
end $$;

-- 3. Audit trail
drop trigger if exists sc_grades_audit on public.sc_grades;
create trigger sc_grades_audit after insert or update or delete on public.sc_grades
  for each row execute function public.audit_row();
drop trigger if exists sc_attendance_audit on public.sc_attendance;
create trigger sc_attendance_audit after update or delete on public.sc_attendance
  for each row execute function public.audit_row();

-- 2. Marks
create or replace function private.sc_save_marks_impl(p_subject uuid, p_term integer, p_marks jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'private'
as $$
declare
  v_tenant uuid := private.current_tenant();
  v_manager boolean := private.current_app_role() = any (array['owner'::user_role, 'manager'::user_role]);
  v_max numeric;
  v_entry jsonb; v_enr uuid; v_mark numeric; v_old numeric;
  v_saved int := 0; v_changed int := 0; v_locked int := 0;
begin
  if v_tenant is null then raise exception 'not_authenticated'; end if;
  if p_term is null or p_term < 1 or p_term > 4 then raise exception 'bad_term'; end if;
  if p_marks is null or jsonb_typeof(p_marks) <> 'array' or jsonb_array_length(p_marks) > 300 then
    raise exception 'bad_mark';
  end if;
  select max_mark into v_max from public.sc_subjects where tenant_id = v_tenant and id = p_subject;
  if not found then raise exception 'subject_not_found'; end if;

  for v_entry in select * from jsonb_array_elements(p_marks) loop
    begin
      v_enr := (v_entry->>'enrollment_id')::uuid;
      v_mark := (v_entry->>'mark')::numeric;
    exception when others then raise exception 'bad_mark';
    end;
    if v_enr is null or v_mark is null or v_mark < 0 or v_mark > v_max or v_mark <> round(v_mark, 2) then
      raise exception 'bad_mark';
    end if;
    if not exists (select 1 from public.sc_enrollments where tenant_id = v_tenant and id = v_enr) then
      raise exception 'enrollment_not_found';
    end if;

    select mark into v_old from public.sc_grades
      where tenant_id = v_tenant and enrollment_id = v_enr and subject_id = p_subject and term = p_term
      for update;
    if not found then
      insert into public.sc_grades(tenant_id, enrollment_id, subject_id, term, mark, updated_at)
        values (v_tenant, v_enr, p_subject, p_term, v_mark, now())
        on conflict (tenant_id, enrollment_id, subject_id, term) do nothing;
      v_saved := v_saved + 1;
    elsif v_old = v_mark then
      null; -- unchanged
    elsif v_manager then
      update public.sc_grades set mark = v_mark, updated_at = now()
        where tenant_id = v_tenant and enrollment_id = v_enr and subject_id = p_subject and term = p_term;
      v_changed := v_changed + 1;
    else
      v_locked := v_locked + 1;
    end if;
  end loop;

  return jsonb_build_object('saved', v_saved, 'changed', v_changed, 'locked', v_locked);
end $$;

create or replace function public.sc_save_marks(p_subject uuid, p_term integer, p_marks jsonb)
returns jsonb
language sql
set search_path to 'public', 'private'
as $$ select private.sc_save_marks_impl(p_subject, p_term, p_marks) $$;

-- 2. Attendance
create or replace function private.sc_save_attendance_impl(p_day date, p_marks jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'private'
as $$
declare
  v_tenant uuid := private.current_tenant();
  v_today date := (now() at time zone 'Africa/Addis_Ababa')::date;
  v_may_change boolean;
  v_entry jsonb; v_enr uuid; v_status text; v_old text;
  v_saved int := 0; v_changed int := 0; v_locked int := 0;
begin
  if v_tenant is null then raise exception 'not_authenticated'; end if;
  if p_day is null or p_day > v_today then raise exception 'bad_day'; end if;
  if p_marks is null or jsonb_typeof(p_marks) <> 'array' or jsonb_array_length(p_marks) > 300 then
    raise exception 'bad_status';
  end if;
  v_may_change := p_day = v_today
    or private.current_app_role() = any (array['owner'::user_role, 'manager'::user_role]);

  for v_entry in select * from jsonb_array_elements(p_marks) loop
    begin
      v_enr := (v_entry->>'enrollment_id')::uuid;
    exception when others then raise exception 'bad_status';
    end;
    v_status := v_entry->>'status';
    if v_enr is null or v_status is null or v_status not in ('present','absent','late','excused') then
      raise exception 'bad_status';
    end if;
    if not exists (select 1 from public.sc_enrollments where tenant_id = v_tenant and id = v_enr) then
      raise exception 'enrollment_not_found';
    end if;

    select status into v_old from public.sc_attendance
      where tenant_id = v_tenant and enrollment_id = v_enr and day = p_day
      for update;
    if not found then
      insert into public.sc_attendance(tenant_id, enrollment_id, day, status)
        values (v_tenant, v_enr, p_day, v_status)
        on conflict (tenant_id, enrollment_id, day) do nothing;
      v_saved := v_saved + 1;
    elsif v_old = v_status then
      null;
    elsif v_may_change then
      update public.sc_attendance set status = v_status
        where tenant_id = v_tenant and enrollment_id = v_enr and day = p_day;
      v_changed := v_changed + 1;
    else
      v_locked := v_locked + 1;
    end if;
  end loop;

  return jsonb_build_object('saved', v_saved, 'changed', v_changed, 'locked', v_locked);
end $$;

create or replace function public.sc_save_attendance(p_day date, p_marks jsonb)
returns jsonb
language sql
set search_path to 'public', 'private'
as $$ select private.sc_save_attendance_impl(p_day, p_marks) $$;

revoke all on function private.sc_save_marks_impl(uuid, integer, jsonb) from public, anon;
revoke all on function private.sc_save_attendance_impl(date, jsonb) from public, anon;
revoke all on function public.sc_save_marks(uuid, integer, jsonb) from public, anon;
revoke all on function public.sc_save_attendance(date, jsonb) from public, anon;
grant execute on function private.sc_save_marks_impl(uuid, integer, jsonb) to authenticated;
grant execute on function private.sc_save_attendance_impl(date, jsonb) to authenticated;
grant execute on function public.sc_save_marks(uuid, integer, jsonb) to authenticated;
grant execute on function public.sc_save_attendance(date, jsonb) to authenticated;
