-- Absence SMS: when a student is marked absent for today, queue one SMS to the parent's phone
-- in the school's language. At most one absence SMS per student per day (sc_absence_notices),
-- so absent -> present -> absent sends nothing twice. Past days never send. A missing or bad
-- phone, or a queue error, never blocks saving attendance. Same function signature and
-- checks as before (create or replace, no drop); the result gains an "sms" count.

create table public.sc_absence_notices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default private.current_tenant() references public.tenants(id) on delete cascade,
  enrollment_id uuid not null,
  day date not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, enrollment_id, day),
  foreign key (tenant_id, enrollment_id) references public.sc_enrollments (tenant_id, id) on delete cascade
);

alter table public.sc_absence_notices enable row level security;

create policy sc_absence_notices_sel on public.sc_absence_notices for select to authenticated
  using (tenant_id = (select private.current_tenant()));

-- Rows are written only by the definer function below.
revoke all on public.sc_absence_notices from anon, authenticated;
grant select on public.sc_absence_notices to authenticated;

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
  v_saved int := 0; v_changed int := 0; v_locked int := 0; v_sms int := 0;
  v_absent uuid[] := '{}';
  v_school text; v_lang text;
  r record; v_phone text; v_body text; v_new uuid;
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
      if v_status = 'absent' then v_absent := v_absent || v_enr; end if;
    elsif v_old = v_status then
      null;
    elsif v_may_change then
      update public.sc_attendance set status = v_status
        where tenant_id = v_tenant and enrollment_id = v_enr and day = p_day;
      v_changed := v_changed + 1;
      if v_status = 'absent' then v_absent := v_absent || v_enr; end if;
    else
      v_locked := v_locked + 1;
    end if;
  end loop;

  -- Absence SMS for today only.
  if p_day = v_today and cardinality(v_absent) > 0 then
    select t.name, coalesce(t.default_lang, 'am') into v_school, v_lang from public.tenants t where t.id = v_tenant;
    for r in
      select e.id as enrollment_id, s.full_name, s.gender, g.phone
      from public.sc_enrollments e
      join public.sc_students s on s.tenant_id = e.tenant_id and s.id = e.student_id
      left join public.sc_guardians g on g.tenant_id = s.tenant_id and g.id = s.guardian_id
      where e.tenant_id = v_tenant and e.id = any (v_absent)
    loop
      v_phone := regexp_replace(coalesce(r.phone, ''), '[\s-]', '', 'g');
      continue when v_phone !~ '^\+?[0-9]{9,15}$';

      insert into public.sc_absence_notices (tenant_id, enrollment_id, day)
        values (v_tenant, r.enrollment_id, p_day)
        on conflict (tenant_id, enrollment_id, day) do nothing
        returning id into v_new;
      continue when v_new is null;

      v_body := case v_lang
        when 'om' then v_school || ': ' || r.full_name || ' har''a mana barumsaa hin dhufne. Gaaffii yoo qabaattan mana barumsaa bilbilaa.'
        when 'en' then v_school || ': ' || r.full_name || ' was marked absent today. Please call the school if you have questions.'
        else v_school || '፡ ' || r.full_name || ' ዛሬ ትምህርት ቤት '
             || case when r.gender = 'f' then 'አልተገኘችም' else 'አልተገኘም' end
             || '። ጥያቄ ካለዎት ትምህርት ቤቱን ይደውሉ።'
      end;
      begin
        perform private.bot_queue_notification(v_tenant, 'sms', v_phone, v_body);
        v_sms := v_sms + 1;
      exception when others then
        null; -- a queue problem must never undo saved attendance
      end;
    end loop;
  end if;

  return jsonb_build_object('saved', v_saved, 'changed', v_changed, 'locked', v_locked, 'sms', v_sms);
end $$;

revoke all on function private.sc_save_attendance_impl(date, jsonb) from public, anon;
grant execute on function private.sc_save_attendance_impl(date, jsonb) to authenticated;
