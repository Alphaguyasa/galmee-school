-- Student photos for ID cards.
-- Private bucket; objects live at <tenant_id>/<student_id>.jpg. Everyone in the tenant can read
-- (signed URLs only), only owner/manager can add, replace or remove a photo.

alter table public.sc_students add column if not exists photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sc-student-photos', 'sc-student-photos', false, 307200, array['image/jpeg'])
on conflict (id) do nothing;

create policy sc_student_photos_select on storage.objects for select to authenticated
  using (bucket_id = 'sc-student-photos'
         and (storage.foldername(name))[1] = (select private.current_tenant())::text);

create policy sc_student_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'sc-student-photos'
              and (storage.foldername(name))[1] = (select private.current_tenant())::text
              and (select private.current_app_role()) in ('owner', 'manager'));

create policy sc_student_photos_update on storage.objects for update to authenticated
  using (bucket_id = 'sc-student-photos'
         and (storage.foldername(name))[1] = (select private.current_tenant())::text
         and (select private.current_app_role()) in ('owner', 'manager'))
  with check (bucket_id = 'sc-student-photos'
              and (storage.foldername(name))[1] = (select private.current_tenant())::text
              and (select private.current_app_role()) in ('owner', 'manager'));

create policy sc_student_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'sc-student-photos'
         and (storage.foldername(name))[1] = (select private.current_tenant())::text
         and (select private.current_app_role()) in ('owner', 'manager'));

-- Records the photo on the student. Owner/manager only; the path must be this tenant's
-- object for this student, so a caller cannot point a student at another school's file.
create or replace function public.sc_set_student_photo(p_student_id uuid)
returns text
language plpgsql
security invoker
set search_path = public, private
as $$
declare
  v_tenant uuid := private.current_tenant();
  v_path text;
begin
  if v_tenant is null or private.current_app_role() not in ('owner', 'manager') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  v_path := v_tenant::text || '/' || p_student_id::text || '.jpg';
  update public.sc_students set photo_path = v_path
   where id = p_student_id and tenant_id = v_tenant;
  if not found then
    raise exception 'student_not_found' using errcode = 'P0002';
  end if;
  return v_path;
end;
$$;

revoke execute on function public.sc_set_student_photo(uuid) from public, anon;
grant execute on function public.sc_set_student_photo(uuid) to authenticated;

-- The register view exposes the photo path for the ID card screen.
create or replace view public.sc_student_register
with (security_invoker = true) as
 SELECT e.tenant_id,
    e.id AS enrollment_id,
    e.academic_year,
    e.roll_no,
    e.class_id,
    c.grade,
    c.section,
    c.sort_order,
    s.id AS student_id,
    s.full_name,
    s.student_no,
    s.gender,
    s.status,
    g.id AS guardian_id,
    g.full_name AS guardian_name,
    g.phone AS guardian_phone,
    s.photo_path
   FROM sc_enrollments e
     JOIN sc_students s ON s.tenant_id = e.tenant_id AND s.id = e.student_id
     JOIN sc_classes c ON c.tenant_id = e.tenant_id AND c.id = e.class_id
     LEFT JOIN sc_guardians g ON g.tenant_id = s.tenant_id AND g.id = s.guardian_id;
