-- Fee-due SMS for one class and period: one SMS per unpaid invoice to the parent's phone,
-- in the school's language. At most one reminder per invoice per day, so a double tap or a
-- second manager pressing the button sends nothing twice. Owner/manager only.

create table public.sc_fee_reminders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default private.current_tenant() references public.tenants(id) on delete cascade,
  invoice_id uuid not null,
  sent_on date not null default (now() at time zone 'Africa/Addis_Ababa')::date,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (tenant_id, invoice_id, sent_on),
  foreign key (tenant_id, invoice_id) references public.sc_fee_invoices (tenant_id, id) on delete cascade
);

alter table public.sc_fee_reminders enable row level security;

create policy sc_fee_reminders_sel on public.sc_fee_reminders for select to authenticated
  using (tenant_id = (select private.current_tenant()));
create policy sc_fee_reminders_ins on public.sc_fee_reminders for insert to authenticated
  with check (tenant_id = (select private.current_tenant())
              and (select private.current_app_role()) in ('owner', 'manager'));

revoke all on public.sc_fee_reminders from anon;
grant select, insert on public.sc_fee_reminders to authenticated;

create or replace function public.sc_queue_fee_reminders(p_class_id uuid, p_period_key text)
returns jsonb
language plpgsql
security invoker
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

revoke execute on function public.sc_queue_fee_reminders(uuid, text) from public, anon;
grant execute on function public.sc_queue_fee_reminders(uuid, text) to authenticated;
