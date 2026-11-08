-- Flat views behind the fee screens (they run with the caller's permissions, so RLS applies).
create view public.sc_invoice_register with (security_invoker = true) as
select i.tenant_id, i.id as invoice_id, i.period_key, i.description, i.amount, i.paid,
  (i.amount - i.paid)::numeric(12,2) as remaining, i.status, i.due_date,
  e.id as enrollment_id, e.academic_year, e.roll_no, e.class_id,
  c.grade, c.section, s.id as student_id, s.full_name,
  g.full_name as guardian_name, g.phone as guardian_phone
from public.sc_fee_invoices i
join public.sc_enrollments e on e.tenant_id = i.tenant_id and e.id = i.enrollment_id
join public.sc_classes c on c.tenant_id = e.tenant_id and c.id = e.class_id
join public.sc_students s on s.tenant_id = e.tenant_id and s.id = e.student_id
left join public.sc_guardians g on g.tenant_id = s.tenant_id and g.id = s.guardian_id;

create view public.sc_receipt_details with (security_invoker = true) as
select r.tenant_id, r.id as receipt_id, r.receipt_no, r.amount, r.method, r.created_at,
  v.invoice_id, v.period_key, v.description, v.amount as invoice_amount, v.remaining,
  v.grade, v.section, v.full_name, v.guardian_name
from public.sc_fee_receipts r
join public.sc_invoice_register v on v.tenant_id = r.tenant_id and v.invoice_id = r.invoice_id;

revoke all on public.sc_invoice_register, public.sc_receipt_details from anon;
grant select on public.sc_invoice_register, public.sc_receipt_details to authenticated;
