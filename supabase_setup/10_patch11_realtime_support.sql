-- MOSCATELLI Patch 11 — Supabase Realtime support
-- Run after 09_patch10_persistence_support.sql.
-- Purpose: enable realtime change delivery for The Record and The Desk.

-- Realtime DELETE events need enough old-row information for the frontend
-- to remove the corresponding rendered item.
alter table public.record_posts replica identity full;
alter table public.record_attachments replica identity full;
alter table public.desk_messages replica identity full;

-- Add the internal tables to Supabase's realtime publication if they are
-- not already present. The DO block keeps this migration safe to rerun.
do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'record_posts'
    ) then
      execute 'alter publication supabase_realtime add table public.record_posts';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'record_attachments'
    ) then
      execute 'alter publication supabase_realtime add table public.record_attachments';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'desk_messages'
    ) then
      execute 'alter publication supabase_realtime add table public.desk_messages';
    end if;
  end if;
end $$;

-- Validation: these rows should appear after the migration.
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
