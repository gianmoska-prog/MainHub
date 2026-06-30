-- MOSCATELLI — Supabase Storage setup
-- Run after 01_schema.sql and 02_rls_policies.sql.
-- Uses a private bucket for The Record attachments.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'record-attachments',
  'record-attachments',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage object policies
-- Expected upload path:
--   {auth.uid()}/{post_id}/{filename}
--
-- Example:
--   1f6...uuid/8a2...post/attachment-001.jpg

drop policy if exists "record_attachment_objects_select_internal" on storage.objects;
create policy "record_attachment_objects_select_internal"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'record-attachments'
  and public.is_internal_member()
);

drop policy if exists "record_attachment_objects_insert_own_folder" on storage.objects;
create policy "record_attachment_objects_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'record-attachments'
  and public.is_internal_member()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "record_attachment_objects_update_own_folder_or_founder" on storage.objects;
create policy "record_attachment_objects_update_own_folder_or_founder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'record-attachments'
  and public.is_internal_member()
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_founder()
  )
)
with check (
  bucket_id = 'record-attachments'
  and public.is_internal_member()
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_founder()
  )
);

drop policy if exists "record_attachment_objects_delete_own_folder_or_founder" on storage.objects;
create policy "record_attachment_objects_delete_own_folder_or_founder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'record-attachments'
  and public.is_internal_member()
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_founder()
  )
);
