-- Flat register for search by name, student number or parent phone (runs with the caller's permissions).
create view public.sc_student_register with (security_invoker = true) as
select e.tenant_id, e.id as enrollment_id, e.academic_year, e.roll_no, e.class_id,
  c.grade, c.section, c.sort_order,
  s.id as student_id, s.full_name, s.student_no, s.gender, s.status,
  g.id as guardian_id, g.full_name as guardian_name, g.phone as guardian_phone
from public.sc_enrollments e
join public.sc_students s on s.tenant_id = e.tenant_id and s.id = e.student_id
join public.sc_classes c on c.tenant_id = e.tenant_id and c.id = e.class_id
left join public.sc_guardians g on g.tenant_id = s.tenant_id and g.id = s.guardian_id;

revoke all on public.sc_student_register from anon;
grant select on public.sc_student_register to authenticated;
