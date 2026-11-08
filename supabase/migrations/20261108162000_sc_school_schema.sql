-- Galmee School schema: classes, students, guardians, enrolments, fees, marks, attendance.
-- Every table is tenant-scoped; composite foreign keys keep references inside one tenant.

create table public.sc_classes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default private.current_tenant() references public.tenants(id) on delete cascade,
  grade text not null check (length(grade) between 1 and 30),
  section text not null default 'A' check (length(section) between 1 and 10),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, grade, section)
);

create table public.sc_guardians (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default private.current_tenant() references public.tenants(id) on delete cascade,
  full_name text not null check (length(full_name) between 2 and 120),
  phone text not null check (phone ~ '^(\+251|0)[1-9][0-9]{8}$'),
  relation text not null default 'parent' check (relation in ('parent','mother','father','guardian','other')),
  telegram_chat_id text,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, phone)
);

create table public.sc_students (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default private.current_tenant() references public.tenants(id) on delete cascade,
  full_name text not null check (length(full_name) between 2 and 120),
  gender text check (gender in ('m','f')),
  date_of_birth date,
  student_no text check (length(student_no) <= 30),
  guardian_id uuid,
  status text not null default 'active' check (status in ('active','left','graduated')),
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, student_no),
  foreign key (tenant_id, guardian_id) references public.sc_guardians(tenant_id, id)
);
create index sc_students_guardian_idx on public.sc_students (tenant_id, guardian_id);

create table public.sc_enrollments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default private.current_tenant() references public.tenants(id) on delete cascade,
  student_id uuid not null,
  class_id uuid not null,
  academic_year integer not null check (academic_year between 2000 and 2100),
  roll_no integer check (roll_no > 0),
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, student_id, academic_year),
  foreign key (tenant_id, student_id) references public.sc_students(tenant_id, id) on delete cascade,
  foreign key (tenant_id, class_id) references public.sc_classes(tenant_id, id)
);
create index sc_enrollments_class_idx on public.sc_enrollments (tenant_id, class_id, academic_year);
create index sc_enrollments_student_idx on public.sc_enrollments (tenant_id, student_id);

create table public.sc_fee_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default private.current_tenant() references public.tenants(id) on delete cascade,
  name text not null check (length(name) between 2 and 80),
  grade text,
  period text not null default 'monthly' check (period in ('monthly','term','annual')),
  amount numeric(12,2) not null check (amount > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, id)
);
create index sc_fee_plans_tenant_idx on public.sc_fee_plans (tenant_id, active);

create table public.sc_fee_invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default private.current_tenant() references public.tenants(id) on delete cascade,
  enrollment_id uuid not null,
  fee_plan_id uuid not null,
  period_key text not null check (period_key ~ '^[0-9]{4}(-(0[1-9]|1[0-3]|T[1-4]))?$'),
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  paid numeric(12,2) not null default 0 check (paid >= 0),
  due_date date,
  status text generated always as (case when paid >= amount then 'paid' when paid > 0 then 'partial' else 'unpaid' end) stored,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, enrollment_id, fee_plan_id, period_key),
  check (paid <= amount),
  foreign key (tenant_id, enrollment_id) references public.sc_enrollments(tenant_id, id) on delete cascade,
  foreign key (tenant_id, fee_plan_id) references public.sc_fee_plans(tenant_id, id)
);
create index sc_fee_invoices_period_idx on public.sc_fee_invoices (tenant_id, period_key, status);
create index sc_fee_invoices_plan_idx on public.sc_fee_invoices (tenant_id, fee_plan_id);

create table public.sc_fee_receipts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default private.current_tenant() references public.tenants(id) on delete cascade,
  invoice_id uuid not null,
  payment_id uuid not null references public.payments(id),
  receipt_no integer not null,
  amount numeric(12,2) not null check (amount > 0),
  method public.pay_method not null,
  client_ref uuid,
  received_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (tenant_id, receipt_no),
  unique (tenant_id, client_ref),
  foreign key (tenant_id, invoice_id) references public.sc_fee_invoices(tenant_id, id) on delete cascade
);
create index sc_fee_receipts_invoice_idx on public.sc_fee_receipts (tenant_id, invoice_id);
create index sc_fee_receipts_payment_idx on public.sc_fee_receipts (payment_id);

create table public.sc_subjects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default private.current_tenant() references public.tenants(id) on delete cascade,
  name text not null check (length(name) between 2 and 80),
  grade text,
  max_mark numeric(6,2) not null default 100 check (max_mark > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, id)
);
create index sc_subjects_tenant_idx on public.sc_subjects (tenant_id, grade);

create table public.sc_grades (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default private.current_tenant() references public.tenants(id) on delete cascade,
  enrollment_id uuid not null,
  subject_id uuid not null,
  term smallint not null check (term between 1 and 4),
  mark numeric(6,2) not null check (mark >= 0),
  updated_at timestamptz not null default now(),
  unique (tenant_id, enrollment_id, subject_id, term),
  foreign key (tenant_id, enrollment_id) references public.sc_enrollments(tenant_id, id) on delete cascade,
  foreign key (tenant_id, subject_id) references public.sc_subjects(tenant_id, id)
);
create index sc_grades_subject_idx on public.sc_grades (tenant_id, subject_id);

create table public.sc_attendance (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default private.current_tenant() references public.tenants(id) on delete cascade,
  enrollment_id uuid not null,
  day date not null,
  status text not null check (status in ('present','absent','late','excused')),
  created_at timestamptz not null default now(),
  unique (tenant_id, enrollment_id, day),
  foreign key (tenant_id, enrollment_id) references public.sc_enrollments(tenant_id, id) on delete cascade
);
create index sc_attendance_day_idx on public.sc_attendance (tenant_id, day);

-- RLS. Money tables have no write policies: fees change only through the RPCs below.
do $$
declare t text;
begin
  foreach t in array array['sc_classes','sc_guardians','sc_students','sc_enrollments','sc_fee_plans','sc_fee_invoices','sc_fee_receipts','sc_subjects','sc_grades','sc_attendance'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('create policy %I on public.%I for select to authenticated using (tenant_id = (select private.current_tenant()))', t||'_sel', t);
  end loop;

  -- Set up by the office: owner or manager only.
  foreach t in array array['sc_classes','sc_fee_plans','sc_subjects'] loop
    execute format($f$create policy %I on public.%I for insert to authenticated with check (tenant_id = (select private.current_tenant()) and (select private.current_app_role()) in ('owner','manager'))$f$, t||'_ins', t);
    execute format($f$create policy %I on public.%I for update to authenticated using (tenant_id = (select private.current_tenant()) and (select private.current_app_role()) in ('owner','manager')) with check (tenant_id = (select private.current_tenant()))$f$, t||'_upd', t);
    execute format($f$create policy %I on public.%I for delete to authenticated using (tenant_id = (select private.current_tenant()) and (select private.current_app_role()) in ('owner','manager'))$f$, t||'_del', t);
  end loop;

  -- Day-to-day records: any staff member writes, only owner or manager deletes.
  foreach t in array array['sc_guardians','sc_students','sc_enrollments','sc_grades','sc_attendance'] loop
    execute format($f$create policy %I on public.%I for insert to authenticated with check (tenant_id = (select private.current_tenant()))$f$, t||'_ins', t);
    execute format($f$create policy %I on public.%I for update to authenticated using (tenant_id = (select private.current_tenant())) with check (tenant_id = (select private.current_tenant()))$f$, t||'_upd', t);
    execute format($f$create policy %I on public.%I for delete to authenticated using (tenant_id = (select private.current_tenant()) and (select private.current_app_role()) in ('owner','manager'))$f$, t||'_del', t);
  end loop;
end $$;

-- Views (run with the caller's permissions, so RLS applies).
create view public.sc_unpaid_by_class with (security_invoker = true) as
select e.tenant_id, e.class_id, c.grade, c.section, c.sort_order, i.period_key,
  count(distinct e.student_id)::int as students,
  count(distinct e.student_id) filter (where i.status <> 'paid')::int as unpaid_students,
  coalesce(sum(i.amount - i.paid), 0)::numeric(12,2) as owed
from public.sc_fee_invoices i
join public.sc_enrollments e on e.tenant_id = i.tenant_id and e.id = i.enrollment_id
join public.sc_classes c on c.tenant_id = e.tenant_id and c.id = e.class_id
group by e.tenant_id, e.class_id, c.grade, c.section, c.sort_order, i.period_key;

create view public.sc_class_term_ranks with (security_invoker = true) as
select g.tenant_id, g.enrollment_id, e.class_id, e.academic_year, g.term,
  sum(g.mark)::numeric(8,2) as total,
  round(avg(g.mark), 2) as average,
  rank() over (partition by g.tenant_id, e.class_id, e.academic_year, g.term order by sum(g.mark) desc)::int as class_rank,
  count(*) over (partition by g.tenant_id, e.class_id, e.academic_year, g.term)::int as class_size
from public.sc_grades g
join public.sc_enrollments e on e.tenant_id = g.tenant_id and e.id = g.enrollment_id
group by g.tenant_id, g.enrollment_id, e.class_id, e.academic_year, g.term;

-- Money RPCs. The definer functions live in `private` (not callable through the API);
-- thin invoker wrappers in `public` are the only way in.
create function private.sc_generate_invoices_impl(p_academic_year integer, p_period text, p_period_key text, p_due date)
returns integer language plpgsql security definer set search_path = public, private as $$
declare v_tenant uuid := private.current_tenant(); v_count integer;
begin
  if v_tenant is null then raise exception 'not_authenticated'; end if;
  if private.current_app_role() not in ('owner','manager') then raise exception 'owner_or_manager_only'; end if;
  if p_period not in ('monthly','term','annual') then raise exception 'invalid_period'; end if;
  if (p_period = 'monthly' and p_period_key !~ '^[0-9]{4}-(0[1-9]|1[0-3])$')
    or (p_period = 'term' and p_period_key !~ '^[0-9]{4}-T[1-4]$')
    or (p_period = 'annual' and p_period_key !~ '^[0-9]{4}$')
    or left(p_period_key, 4)::int <> p_academic_year then
    raise exception 'invalid_period_key';
  end if;

  insert into public.sc_fee_invoices (tenant_id, enrollment_id, fee_plan_id, period_key, description, amount, due_date)
  select v_tenant, e.id, p.id, p_period_key, p.name, p.amount, p_due
  from public.sc_enrollments e
  join public.sc_students s on s.tenant_id = e.tenant_id and s.id = e.student_id and s.status = 'active'
  join public.sc_classes c on c.tenant_id = e.tenant_id and c.id = e.class_id
  join public.sc_fee_plans p on p.tenant_id = e.tenant_id and p.active and p.period = p_period
    and (p.grade is null or p.grade = c.grade)
  where e.tenant_id = v_tenant and e.academic_year = p_academic_year
  on conflict (tenant_id, enrollment_id, fee_plan_id, period_key) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

create function private.sc_record_fee_payment_impl(p_invoice uuid, p_amount numeric, p_method public.pay_method, p_reference text, p_client_ref uuid)
returns jsonb language plpgsql security definer set search_path = public, private as $$
declare
  v_tenant uuid := private.current_tenant();
  v_inv public.sc_fee_invoices%rowtype;
  v_payment uuid; v_no integer; v_receipt public.sc_fee_receipts%rowtype;
begin
  if v_tenant is null then raise exception 'not_authenticated'; end if;
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then raise exception 'invalid_amount'; end if;

  -- Serialises receipt numbers and makes the client_ref check safe under retries.
  perform pg_advisory_xact_lock(hashtextextended('sc_receipt:' || v_tenant::text, 0));

  if p_client_ref is not null then
    select * into v_receipt from public.sc_fee_receipts where tenant_id = v_tenant and client_ref = p_client_ref;
    if found then
      select * into v_inv from public.sc_fee_invoices where tenant_id = v_tenant and id = v_receipt.invoice_id;
      return jsonb_build_object('receipt_id', v_receipt.id, 'receipt_no', v_receipt.receipt_no, 'amount', v_receipt.amount, 'remaining', v_inv.amount - v_inv.paid, 'replayed', true);
    end if;
  end if;

  select * into v_inv from public.sc_fee_invoices where tenant_id = v_tenant and id = p_invoice for update;
  if not found then raise exception 'invoice_not_found'; end if;
  if p_amount > v_inv.amount - v_inv.paid then raise exception 'overpayment'; end if;

  insert into public.payments (tenant_id, amount, method, reference, ref_table, ref_id)
  values (v_tenant, p_amount, p_method, p_reference, 'sc_fee_invoices', v_inv.id)
  returning id into v_payment;

  update public.sc_fee_invoices set paid = paid + p_amount where tenant_id = v_tenant and id = v_inv.id;

  select coalesce(max(receipt_no), 0) + 1 into v_no from public.sc_fee_receipts where tenant_id = v_tenant;
  insert into public.sc_fee_receipts (tenant_id, invoice_id, payment_id, receipt_no, amount, method, client_ref)
  values (v_tenant, v_inv.id, v_payment, v_no, p_amount, p_method, p_client_ref)
  returning * into v_receipt;

  return jsonb_build_object('receipt_id', v_receipt.id, 'receipt_no', v_no, 'amount', p_amount, 'remaining', v_inv.amount - v_inv.paid - p_amount, 'replayed', false);
end $$;

create function public.sc_generate_invoices(p_academic_year integer, p_period text, p_period_key text, p_due date default null)
returns integer language sql security invoker set search_path = public, private
as $$ select private.sc_generate_invoices_impl(p_academic_year, p_period, p_period_key, p_due) $$;

create function public.sc_record_fee_payment(p_invoice uuid, p_amount numeric, p_method public.pay_method default 'cash', p_reference text default null, p_client_ref uuid default null)
returns jsonb language sql security invoker set search_path = public, private
as $$ select private.sc_record_fee_payment_impl(p_invoice, p_amount, p_method, p_reference, p_client_ref) $$;

revoke all on function private.sc_generate_invoices_impl(integer, text, text, date) from public, anon;
revoke all on function private.sc_record_fee_payment_impl(uuid, numeric, public.pay_method, text, uuid) from public, anon;
grant execute on function private.sc_generate_invoices_impl(integer, text, text, date) to authenticated;
grant execute on function private.sc_record_fee_payment_impl(uuid, numeric, public.pay_method, text, uuid) to authenticated;
revoke all on function public.sc_generate_invoices(integer, text, text, date) from public, anon;
revoke all on function public.sc_record_fee_payment(uuid, numeric, public.pay_method, text, uuid) from public, anon;
grant execute on function public.sc_generate_invoices(integer, text, text, date) to authenticated;
grant execute on function public.sc_record_fee_payment(uuid, numeric, public.pay_method, text, uuid) to authenticated;
