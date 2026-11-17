-- The notification queue is only reachable from definer code (as in sc_record_fee_payment),
-- so the reminder logic moves to a private definer function with its own tenant and role
-- checks; the public function becomes a thin invoker wrapper (create or replace, no drop).

create function private.sc_queue_fee_reminders_impl(p_class_id uuid, p_period_key text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_tenant uuid := private.current_tenant();
  v_school text; v_lang text;
  v_queued int := 0; v_no_phone int := 0; v_already int := 0;
  r record; v_phone text; v_owed text; v_body text; v_new uuid;
begin
  if v_tenant is null or private.current_app_role() not in ('owner', 'manager') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_period_key is null or length(p_period_key) > 20 then
    raise exception 'bad_period' using errcode = '22023';
  end if;

  select t.name, coalesce(t.default_lang, 'am') into v_school, v_lang from public.tenants t where t.id = v_tenant;

  for r in
    select v.invoice_id, v.full_name, v.description, v.remaining, v.guardian_phone
    from public.sc_invoice_register v
    where v.tenant_id = v_tenant and v.class_id = p_class_id and v.period_key = p_period_key
      and v.status <> 'paid' and v.remaining > 0
    order by v.roll_no nulls last, v.full_name
  loop
    v_phone := regexp_replace(coalesce(r.guardian_phone, ''), '[\s-]', '', 'g');
    if v_phone !~ '^\+?[0-9]{9,15}$' then
      v_no_phone := v_no_phone + 1;
      continue;
    end if;

    insert into public.sc_fee_reminders (tenant_id, invoice_id) values (v_tenant, r.invoice_id)
    on conflict (tenant_id, invoice_id, sent_on) do nothing
    returning id into v_new;
    if v_new is null then
      v_already := v_already + 1;
      continue;
    end if;

    v_owed := to_char(r.remaining, 'FM999,999,990.00');
    v_body := case v_lang
      when 'om' then v_school || ': Yaadachiisa. ' || r.full_name || 'f qarshii ' || v_owed || ' hin kaffalamne (' || r.description || '). Maaloo waajjira mana barumsaatti kaffalaa.'
      when 'en' then v_school || ': Reminder. ' || v_owed || ' birr is still owed for ' || r.full_name || ' (' || r.description || '). Please pay at the school office.'
      else v_school || '፡ ማስታወሻ። ለ' || r.full_name || ' ' || v_owed || ' ብር አልተከፈለም (' || r.description || ')። እባክዎ በትምህርት ቤቱ ቢሮ ይክፈሉ።'
    end;
    perform private.bot_queue_notification(v_tenant, 'sms', v_phone, v_body);
    v_queued := v_queued + 1;
  end loop;

  return jsonb_build_object('queued', v_queued, 'no_phone', v_no_phone, 'already_today', v_already);
end
$$;

revoke all on function private.sc_queue_fee_reminders_impl(uuid, text) from public, anon;
grant execute on function private.sc_queue_fee_reminders_impl(uuid, text) to authenticated;

create or replace function public.sc_queue_fee_reminders(p_class_id uuid, p_period_key text)
returns jsonb language sql security invoker set search_path = public, private
as $$ select private.sc_queue_fee_reminders_impl(p_class_id, p_period_key) $$;

revoke all on function public.sc_queue_fee_reminders(uuid, text) from public, anon;
grant execute on function public.sc_queue_fee_reminders(uuid, text) to authenticated;
