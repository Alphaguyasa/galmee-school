-- Report card ready: one message per student per term to the parent, by Telegram when the
-- parent's chat is linked, otherwise by SMS, in the school's language. Only students with at
-- least one mark that term are told. sc_report_card_notices keeps it to once per student and
-- term, so pressing the button again only reaches students whose marks came in later.
-- Owner/manager only. Same definer + invoker wrapper shape as sc_queue_fee_reminders.

create table public.sc_report_card_notices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default private.current_tenant() references public.tenants(id) on delete cascade,
  enrollment_id uuid not null,
  term smallint not null check (term between 1 and 4),
  channel text not null check (channel in ('telegram', 'sms')),
  created_at timestamptz not null default now(),
  unique (tenant_id, enrollment_id, term),
  foreign key (tenant_id, enrollment_id) references public.sc_enrollments (tenant_id, id) on delete cascade
);

alter table public.sc_report_card_notices enable row level security;

create policy sc_report_card_notices_sel on public.sc_report_card_notices for select to authenticated
  using (tenant_id = (select private.current_tenant()));

-- Rows are written only by the definer function below.
revoke all on public.sc_report_card_notices from anon, authenticated;
grant select on public.sc_report_card_notices to authenticated;

create function private.sc_queue_report_card_notices_impl(p_class_id uuid, p_year integer, p_term smallint)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_tenant uuid := private.current_tenant();
  v_school text; v_lang text;
  v_telegram int := 0; v_sms int := 0; v_no_contact int := 0; v_already int := 0; v_no_marks int := 0;
  r record; v_phone text; v_chat text; v_channel text; v_to text; v_body text; v_new uuid;
begin
  if v_tenant is null or private.current_app_role() not in ('owner', 'manager') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_term is null or p_term not between 1 and 4 then
    raise exception 'bad_term' using errcode = '22023';
  end if;
  if p_year is null or p_year not between 2000 and 2100 then
    raise exception 'bad_period' using errcode = '22023';
  end if;

  select t.name, coalesce(t.default_lang, 'am') into v_school, v_lang from public.tenants t where t.id = v_tenant;

  for r in
    select e.id as enrollment_id, s.full_name, g.phone, g.telegram_chat_id,
           exists (select 1 from public.sc_grades gr where gr.tenant_id = v_tenant and gr.enrollment_id = e.id and gr.term = p_term) as has_marks
    from public.sc_enrollments e
    join public.sc_students s on s.tenant_id = e.tenant_id and s.id = e.student_id
    left join public.sc_guardians g on g.tenant_id = s.tenant_id and g.id = s.guardian_id
    where e.tenant_id = v_tenant and e.class_id = p_class_id and e.academic_year = p_year
      and s.status = 'active'
    order by e.roll_no nulls last, s.full_name
  loop
    if not r.has_marks then
      v_no_marks := v_no_marks + 1;
      continue;
    end if;

    v_chat := btrim(coalesce(r.telegram_chat_id, ''));
    v_phone := regexp_replace(coalesce(r.phone, ''), '[\s-]', '', 'g');
    if v_chat ~ '^-?[0-9]{1,20}$' then
      v_channel := 'telegram'; v_to := v_chat;
    elsif v_phone ~ '^\+?[0-9]{9,15}$' then
      v_channel := 'sms'; v_to := v_phone;
    else
      v_no_contact := v_no_contact + 1;
      continue;
    end if;

    v_new := null;
    insert into public.sc_report_card_notices (tenant_id, enrollment_id, term, channel)
    values (v_tenant, r.enrollment_id, p_term, v_channel)
    on conflict (tenant_id, enrollment_id, term) do nothing
    returning id into v_new;
    if v_new is null then
      v_already := v_already + 1;
      continue;
    end if;

    v_body := case v_lang
      when 'om' then v_school || ': Kaardiin qabxii ' || r.full_name || ' kan semistara ' || p_term || ' qophaa''eera. Maaloo mana barumsaatti fudhadhaa.'
      when 'en' then v_school || ': The term ' || p_term || ' report card for ' || r.full_name || ' is ready. Please collect it at the school.'
      else v_school || '፡ የ' || r.full_name || ' የ' || p_term || 'ኛ ወሰነ ትምህርት የውጤት ካርድ ተዘጋጅቷል። እባክዎ ከትምህርት ቤቱ ይውሰዱ።'
    end;
    perform private.bot_queue_notification(v_tenant, v_channel, v_to, v_body);
    if v_channel = 'telegram' then v_telegram := v_telegram + 1; else v_sms := v_sms + 1; end if;
  end loop;

  return jsonb_build_object('telegram', v_telegram, 'sms', v_sms, 'no_contact', v_no_contact,
                            'already', v_already, 'no_marks', v_no_marks);
end
$$;

revoke all on function private.sc_queue_report_card_notices_impl(uuid, integer, smallint) from public, anon;
grant execute on function private.sc_queue_report_card_notices_impl(uuid, integer, smallint) to authenticated;

create function public.sc_queue_report_card_notices(p_class_id uuid, p_year integer, p_term smallint)
returns jsonb language sql security invoker set search_path = public, private
as $$ select private.sc_queue_report_card_notices_impl(p_class_id, p_year, p_term) $$;

revoke all on function public.sc_queue_report_card_notices(uuid, integer, smallint) from public, anon;
grant execute on function public.sc_queue_report_card_notices(uuid, integer, smallint) to authenticated;
