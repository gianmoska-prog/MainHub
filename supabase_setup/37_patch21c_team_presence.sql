-- MOSCATELLI MainHub team presence / last-seen support
-- Run after the existing profiles table and internal-member policy helpers.

create table if not exists public.team_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

create index if not exists team_presence_last_seen_idx
  on public.team_presence (last_seen_at desc);

alter table public.team_presence enable row level security;

grant select, insert, update on table public.team_presence to authenticated;
grant all on table public.team_presence to service_role;

drop policy if exists "team_presence_select_internal" on public.team_presence;
create policy "team_presence_select_internal"
on public.team_presence
for select
to authenticated
using (public.is_internal_member());

drop policy if exists "team_presence_insert_self" on public.team_presence;
create policy "team_presence_insert_self"
on public.team_presence
for insert
to authenticated
with check (public.is_internal_member() and user_id = auth.uid());

drop policy if exists "team_presence_update_self" on public.team_presence;
create policy "team_presence_update_self"
on public.team_presence
for update
to authenticated
using (public.is_internal_member() and user_id = auth.uid())
with check (public.is_internal_member() and user_id = auth.uid());

comment on table public.team_presence is
  'Lightweight MainHub last-seen timestamps. Live online state is ephemeral Supabase Realtime Presence and is not persisted here.';

notify pgrst, 'reload schema';


-- Private Realtime Presence authorization.
-- The client joins this topic with config.private = true. Public and private
-- channels with the same topic are isolated by Supabase Realtime.
drop policy if exists "mainhub_team_presence_receive" on realtime.messages;
create policy "mainhub_team_presence_receive"
on realtime.messages
for select
to authenticated
using (
  (select realtime.topic()) = 'moscatelli-team-presence'
  and realtime.messages.extension = 'presence'
  and public.is_internal_member()
);

drop policy if exists "mainhub_team_presence_track" on realtime.messages;
create policy "mainhub_team_presence_track"
on realtime.messages
for insert
to authenticated
with check (
  (select realtime.topic()) = 'moscatelli-team-presence'
  and realtime.messages.extension = 'presence'
  and public.is_internal_member()
);
