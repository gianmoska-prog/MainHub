-- MOSCATELLI Operations Calendar
-- Run after the existing profiles table and internal-member policy helpers.

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  title text not null check (length(trim(title)) > 0 and length(title) <= 120),
  event_date date not null,
  all_day boolean not null default true,
  start_time time,
  end_time time,
  category text not null default 'milestone' check (
    category in ('milestone', 'meeting', 'production', 'launch', 'travel', 'admin')
  ),
  notes text not null default '' check (length(notes) <= 1200),
  constraint calendar_events_time_order check (
    all_day
    or start_time is null
    or end_time is null
    or end_time > start_time
  )
);

create index if not exists calendar_events_event_date_idx
  on public.calendar_events (event_date, all_day desc, start_time asc);
create index if not exists calendar_events_created_by_idx
  on public.calendar_events (created_by);
create index if not exists calendar_events_category_idx
  on public.calendar_events (category);

create or replace function public.touch_calendar_event_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Preserve ownership even though schedule details are collaboratively editable.
  new.created_by = old.created_by;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists calendar_events_touch_updated_at on public.calendar_events;
create trigger calendar_events_touch_updated_at
before update on public.calendar_events
for each row execute function public.touch_calendar_event_updated_at();

alter table public.calendar_events enable row level security;

grant select, insert, update, delete on table public.calendar_events to authenticated;
grant all on table public.calendar_events to service_role;

drop policy if exists "calendar_events_select_internal" on public.calendar_events;
create policy "calendar_events_select_internal"
on public.calendar_events
for select
to authenticated
using (public.is_internal_member());

drop policy if exists "calendar_events_insert_internal" on public.calendar_events;
create policy "calendar_events_insert_internal"
on public.calendar_events
for insert
to authenticated
with check (
  public.is_internal_member()
  and created_by = auth.uid()
);

-- Calendar events are deliberately collaborative: every active internal member
-- may update or remove shared schedule items, as in a team calendar.
drop policy if exists "calendar_events_update_internal" on public.calendar_events;
create policy "calendar_events_update_internal"
on public.calendar_events
for update
to authenticated
using (public.is_internal_member())
with check (public.is_internal_member());

drop policy if exists "calendar_events_delete_internal" on public.calendar_events;
create policy "calendar_events_delete_internal"
on public.calendar_events
for delete
to authenticated
using (public.is_internal_member());

comment on table public.calendar_events is
  'Shared MOSCATELLI Operations calendar for meetings, milestones, production, travel, administration, and launches.';

notify pgrst, 'reload schema';


-- Enable Supabase Realtime for collaborative updates when the publication exists.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'calendar_events'
     ) then
    alter publication supabase_realtime add table public.calendar_events;
  end if;
end;
$$;
