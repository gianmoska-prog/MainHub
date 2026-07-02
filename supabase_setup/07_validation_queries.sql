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

-- Patch 11 realtime validation

select
  pubname,
  schemaname,
  tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename in ('record_posts', 'record_attachments', 'desk_messages')
order by tablename;

select
  relname as table_name,
  case relreplident
    when 'd' then 'default'
    when 'n' then 'nothing'
    when 'f' then 'full'
    when 'i' then 'index'
    else relreplident::text
  end as replica_identity
from pg_class
where oid in (
  'public.record_posts'::regclass,
  'public.record_attachments'::regclass,
  'public.desk_messages'::regclass
)
order by relname;


-- Patch 12D. Desk soft-delete columns
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'desk_messages'
  and column_name in ('deleted_at', 'deleted_by', 'deleted_by_display')
order by column_name;


-- Patch 13I. Desk shared visibility diagnostic
select
  channel,
  count(*) as total_messages,
  count(*) filter (where deleted_at is null) as live_messages,
  count(*) filter (where deleted_at is not null) as deleted_messages,
  count(distinct created_by) as distinct_senders
from public.desk_messages
group by channel
order by channel;


-- Patch 13J. Desk should be soft-delete only for browser clients.
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'desk_messages'
  and grantee = 'authenticated'
order by privilege_type;

select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'desk_messages'
  and cmd = 'DELETE'
order by policyname;
