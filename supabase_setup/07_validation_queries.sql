-- MOSCATELLI — Validation queries
-- Run these after schema, policies, storage, and profile activation.

-- 1. Tables exist
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'record_posts', 'record_attachments', 'desk_messages')
order by table_name;

-- 2. RLS is enabled
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'record_posts', 'record_attachments', 'desk_messages')
order by tablename;

-- 3. Policies exist
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'record_posts', 'record_attachments', 'desk_messages')
order by tablename, policyname;

-- 4. Storage bucket exists
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'record-attachments';

-- 5. Storage policies exist
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'record_attachment_objects_%'
order by policyname;

-- 6. Active internal profiles
select id, email, display_name, role, division, is_active
from public.profiles
order by created_at;


-- Hardening validation

select
  conname,
  contype
from pg_constraint
where conrelid in (
  'public.profiles'::regclass,
  'public.record_posts'::regclass,
  'public.record_attachments'::regclass,
  'public.desk_messages'::regclass
)
and conname in (
  'profiles_id_fkey',
  'record_posts_created_by_fkey',
  'record_attachments_created_by_fkey',
  'desk_messages_created_by_fkey',
  'record_attachments_bucket_check'
)
order by conname;

select
  proname
from pg_proc
where proname in (
  'can_delete_owned_or_founder',
  'validate_record_attachment_metadata',
  'set_desk_message_sender_snapshot',
  'record_attachment_object_matches_post'
)
order by proname;

select
  policyname,
  cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'record_attachment_objects_%'
order by policyname;
