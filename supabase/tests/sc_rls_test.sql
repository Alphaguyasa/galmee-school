-- Galmee School cross-tenant RLS and money RPC test. Run with Supabase `execute_sql`.
-- Creates throwaway users/tenants, runs the checks, then RAISES so everything rolls back.
-- The exception message is the result line; every item should read `ok`.
do $$
declare
  ua uuid := gen_random_uuid(); ub uuid := gen_random_uuid(); uc uuid := gen_random_uuid();
  ta uuid; tb uuid;
  ca uuid; cb uuid; ga uuid; sa uuid; sb uuid; ea uuid; eb uuid; pa uuid; pb uuid; ia uuid; ib uuid;
  ref1 uuid := gen_random_uuid(); sa2 uuid; r jsonb; n int; res text := ''; msg text;
begin
  insert into auth.users(id, aud, role, email) values
    (ua,'authenticated','authenticated','sc-rls-a@test.invalid'),
    (ub,'authenticated','authenticated','sc-rls-b@test.invalid'),
    (uc,'authenticated','authenticated','sc-rls-c@test.invalid');
  insert into public.tenants(name, vertical) values ('RLS School A','school') returning id into ta;
  insert into public.tenants(name, vertical) values ('RLS School B','school') returning id into tb;
  insert into public.profiles(user_id, tenant_id, full_name, role) values
    (ua, ta, 'A owner','owner'), (ub, tb, 'B owner','owner'), (uc, ta, 'A staff','staff');

  insert into public.sc_classes(tenant_id, grade) values (ta,'Grade 1') returning id into ca;
  insert into public.sc_classes(tenant_id, grade) values (tb,'Grade 1') returning id into cb;
  insert into public.sc_guardians(tenant_id, full_name, phone) values (ta,'Parent A','0911000001') returning id into ga;
  insert into public.sc_students(tenant_id, full_name, guardian_id) values (ta,'Student A', ga) returning id into sa;
  insert into public.sc_students(tenant_id, full_name) values (tb,'Student B') returning id into sb;
  insert into public.sc_enrollments(tenant_id, student_id, class_id, academic_year) values (ta, sa, ca, 2019) returning id into ea;
  insert into public.sc_enrollments(tenant_id, student_id, class_id, academic_year) values (tb, sb, cb, 2019) returning id into eb;
  insert into public.sc_fee_plans(tenant_id, name, amount) values (ta,'Tuition', 1000) returning id into pa;
  insert into public.sc_fee_plans(tenant_id, name, amount) values (tb,'Tuition', 900) returning id into pb;

  perform set_config('role','authenticated', true);

  -- Owner A generates invoices for their own school only.
  perform set_config('request.jwt.claims', json_build_object('sub', ua, 'role','authenticated')::text, true);
  select public.sc_generate_invoices(2019,'monthly','2019-03') into n;
  res := res || 'generate ' || case when n=1 then 'ok' else 'FAIL '||n end || '; ';
  select public.sc_generate_invoices(2019,'monthly','2019-03') into n;
  res := res || 'generate repeat ' || case when n=0 then 'ok' else 'FAIL '||n end || '; ';
  select id into ia from public.sc_fee_invoices;
  select count(*) into n from public.sc_students;
  res := res || 'A sees own students ' || case when n=1 then 'ok' else 'FAIL '||n end || '; ';

  -- Cross-tenant insert with a forged tenant_id is refused.
  begin insert into public.sc_students(tenant_id, full_name) values (tb,'Forged'); msg := 'inserted';
  exception when others then msg := 'denied'; end;
  res := res || 'forged insert ' || case when msg='denied' then 'ok' else 'FAIL' end || '; ';

  -- A student cannot point at another tenant's guardian or class.
  begin insert into public.sc_enrollments(student_id, class_id, academic_year) values (sa, cb, 2018); msg := 'inserted';
  exception when others then msg := 'denied'; end;
  res := res || 'cross-tenant class ' || case when msg='denied' then 'ok' else 'FAIL' end || '; ';

  -- Staff can take a payment, cannot generate invoices or touch fee rows directly.
  perform set_config('request.jwt.claims', json_build_object('sub', uc, 'role','authenticated')::text, true);
  begin perform public.sc_generate_invoices(2019,'monthly','2019-04'); msg := 'ran'; exception when others then msg := sqlerrm; end;
  res := res || 'staff generate ' || case when msg='owner_or_manager_only' then 'ok' else 'FAIL '||msg end || '; ';
  update public.sc_fee_invoices set paid = amount where id = ia;
  select paid::int into n from public.sc_fee_invoices where id = ia;
  res := res || 'direct invoice update ' || case when n=0 then 'ok' else 'FAIL '||n end || '; ';
  begin insert into public.sc_fee_plans(name, amount) values ('Staff plan', 5); msg := 'inserted'; exception when others then msg := 'denied'; end;
  res := res || 'staff plan insert ' || case when msg='denied' then 'ok' else 'FAIL' end || '; ';
  select public.sc_record_fee_payment(ia, 400, 'cash', null, ref1) into r;
  res := res || 'payment ' || case when (r->>'receipt_no')='1' and (r->>'remaining')::numeric=600 then 'ok' else 'FAIL '||r::text end || '; ';
  select public.sc_record_fee_payment(ia, 400, 'cash', null, ref1) into r;
  res := res || 'replay ' || case when (r->>'replayed')='true' and (r->>'receipt_no')='1' then 'ok' else 'FAIL '||r::text end || '; ';
  select paid::int into n from public.sc_fee_invoices where id = ia;
  res := res || 'paid once ' || case when n=400 then 'ok' else 'FAIL '||n end || '; ';
  begin perform public.sc_record_fee_payment(ia, 601); msg := 'ran'; exception when others then msg := sqlerrm; end;
  res := res || 'overpayment ' || case when msg='overpayment' then 'ok' else 'FAIL '||msg end || '; ';
  select count(*) into n from public.payments where ref_table='sc_fee_invoices' and ref_id=ia;
  res := res || 'core payment ' || case when n=1 then 'ok' else 'FAIL '||n end || '; ';

  -- Staff can register a student; the register view shows them in roll order.
  select public.sc_add_student('New Pupil','f',null,ca,2019,'New Parent','0911000002','mother') into sa2;
  select roll_no into n from public.sc_student_register where student_id = sa2;
  res := res || 'add student roll ' || case when n=1 then 'ok' else 'FAIL '||coalesce(n,-1) end || '; ';
  select count(*) into n from public.sc_student_register where guardian_phone like '%000002%' and academic_year = 2019;
  res := res || 'register search ' || case when n=1 then 'ok' else 'FAIL '||n end || '; ';
  begin perform public.sc_add_student('Cross Pupil','m',null,cb,2019,'Cross Parent','0911000003','parent'); msg := 'ran';
  exception when others then msg := 'denied'; end;
  res := res || 'add student cross-tenant class ' || case when msg='denied' then 'ok' else 'FAIL' end || '; ';

  -- Tenant B sees and pays nothing of tenant A.
  perform set_config('request.jwt.claims', json_build_object('sub', ub, 'role','authenticated')::text, true);
  select count(*) into n from public.sc_fee_invoices;
  res := res || 'B invoices ' || case when n=0 then 'ok' else 'FAIL '||n end || '; ';
  select count(*) into n from public.sc_fee_receipts;
  res := res || 'B receipts ' || case when n=0 then 'ok' else 'FAIL '||n end || '; ';
  select count(*) into n from public.sc_unpaid_by_class;
  res := res || 'B unpaid view ' || case when n=0 then 'ok' else 'FAIL '||n end || '; ';
  begin perform public.sc_record_fee_payment(ia, 100); msg := 'ran'; exception when others then msg := sqlerrm; end;
  res := res || 'B pays A invoice ' || case when msg='invoice_not_found' then 'ok' else 'FAIL '||msg end || '; ';
  select count(*) into n from public.sc_student_register where tenant_id = ta;
  res := res || 'B register view ' || case when n=0 then 'ok' else 'FAIL '||n end || '; ';
  select count(*) into n from public.sc_invoice_register where tenant_id = ta;
  res := res || 'B invoice register ' || case when n=0 then 'ok' else 'FAIL '||n end || '; ';
  select count(*) into n from public.sc_receipt_details where tenant_id = ta;
  res := res || 'B receipt details ' || case when n=0 then 'ok' else 'FAIL '||n end || '; ';
  update public.sc_students set full_name = 'Hacked' where id = sa;
  get diagnostics n = row_count;
  res := res || 'B update A student ' || case when n=0 then 'ok' else 'FAIL '||n end || '; ';

  -- Anon sees nothing and cannot call the RPCs.
  perform set_config('role','anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin select count(*) into n from public.sc_students; msg := n::text; exception when others then msg := 'denied'; end;
  res := res || 'anon students ' || case when msg in ('denied','0') then 'ok' else 'FAIL '||msg end || '; ';
  begin perform public.sc_record_fee_payment(ia, 1); msg := 'ran'; exception when others then msg := 'denied'; end;
  res := res || 'anon rpc ' || case when msg='denied' then 'ok' else 'FAIL' end || '; ';

  begin select count(*) into n from public.sc_student_register; msg := n::text; exception when others then msg := 'denied'; end;
  res := res || 'anon register ' || case when msg in ('denied','0') then 'ok' else 'FAIL '||msg end || '; ';
  begin perform public.sc_add_student('Anon','m',null,ca,2019,'Anon Parent','0911000004','parent'); msg := 'ran'; exception when others then msg := 'denied'; end;
  res := res || 'anon add student ' || case when msg='denied' then 'ok' else 'FAIL' end || '; ';

  begin select count(*) into n from public.sc_invoice_register; msg := n::text; exception when others then msg := 'denied'; end;
  res := res || 'anon invoice register ' || case when msg in ('denied','0') then 'ok' else 'FAIL '||msg end || '; ';
  begin select count(*) into n from public.sc_receipt_details; msg := n::text; exception when others then msg := 'denied'; end;
  res := res || 'anon receipt details ' || case when msg in ('denied','0') then 'ok' else 'FAIL '||msg end || '; ';

  raise exception 'SC_RLS_RESULT %', res;
end $$;
