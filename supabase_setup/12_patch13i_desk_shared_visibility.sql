-- Patch 13I — shared Desk visibility reset
-- Run this once in Supabase SQL Editor if users can send messages but cannot see each other's live messages.
-- Patch 13J later removes hard-delete permission; this file intentionally grants no DELETE privilege.
-- This makes The Desk a shared internal correspondence channel for every active internal profile.

begin;

grant usage on schema public to authenticated;
grant select, insert, update on table public.desk_messages to authenticated;
grant execute on function public.is_internal_member() to authenticated;
grant execute on function public.can_delete_owned_or_founder(uuid) to authenticated;

drop policy if exists "desk_messages_select_internal" on public.desk_messages;

create policy "desk_messages_select_internal"
on public.desk_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
  )
);

-- Keep insert/update ownership restrictions explicit.
drop policy if exists "desk_messages_insert_internal" on public.desk_messages;

create policy "desk_messages_insert_internal"
on public.desk_messages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
  )
  and created_by = auth.uid()
);

drop policy if exists "desk_messages_update_own_or_founder" on public.desk_messages;

create policy "desk_messages_update_own_or_founder"
on public.desk_messages
for update
to authenticated
using (public.can_delete_owned_or_founder(created_by))
with check (public.can_delete_owned_or_founder(created_by));

-- Realtime publication safety. Safe to rerun.
alter table public.desk_messages replica identity full;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'desk_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.desk_messages';
  end if;
end $$;

commit;

-- Visibility diagnostic. Run separately if desired.
select
  id,
  channel,
  sender_display,
  created_by,
  body,
  deleted_at,
  deleted_by_display,
  created_at
from public.desk_messages
where channel = 'desk'
order by created_at asc;
