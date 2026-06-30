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
