-- MOSCATELLI — Patch 10 persistence support
-- Run after Patch 9 hardening if Record attachments fail to upload.
-- This corrects the Storage path helper for paths shaped as:
--   {auth.uid()}/{post_id}/{filename}
-- Supabase storage.foldername(name) returns the folder segments, not the filename.

create or replace function public.record_attachment_object_matches_post(
  object_name text,
  allow_founder boolean default false
)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  with parts as (
    select storage.foldername(object_name) as p
  )
  select coalesce(
    array_length(p, 1) >= 2
    and exists (
      select 1
      from public.record_posts rp
      where rp.id::text = p[2]
        and rp.created_by::text = p[1]
        and (
          p[1] = auth.uid()::text
          or (allow_founder and public.is_founder())
        )
    ),
    false
  )
  from parts;
$$;
