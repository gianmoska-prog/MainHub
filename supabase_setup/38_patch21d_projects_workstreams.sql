-- MOSCATELLI MainHub — Operations Projects / Workstreams
-- Run after profiles/internal-member helpers and Calendar patches 35/36.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null check (length(trim(name)) > 0 and length(name) <= 120),
  description text not null default '' check (length(description) <= 1600),
  status text not null default 'planned' check (status in ('planned','active','paused','completed','archived')),
  start_date date,
  target_date date,
  next_action text not null default '' check (length(next_action) <= 600),
  constraint projects_date_order check (start_date is null or target_date is null or target_date >= start_date)
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  title text not null check (length(trim(title)) > 0 and length(title) <= 160),
  due_date date,
  completed boolean not null default false,
  completed_at timestamptz,
  sort_order integer not null default 0,
  constraint project_milestones_completion_consistency check ((completed and completed_at is not null) or (not completed and completed_at is null))
);

alter table public.calendar_events add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists projects_status_target_idx on public.projects(status,target_date);
create index if not exists projects_owner_idx on public.projects(owner_id);
create index if not exists project_milestones_project_idx on public.project_milestones(project_id,completed,due_date,sort_order);
create index if not exists calendar_events_project_idx on public.calendar_events(project_id,event_date);

create or replace function public.touch_project_updated_at() returns trigger language plpgsql security invoker set search_path=public as $$ begin new.created_by=old.created_by; new.updated_at=now(); return new; end; $$;
create or replace function public.touch_project_milestone_updated_at() returns trigger language plpgsql security invoker set search_path=public as $$ begin new.created_by=old.created_by; new.project_id=old.project_id; new.updated_at=now(); if new.completed and not old.completed then new.completed_at=coalesce(new.completed_at,now()); elsif not new.completed then new.completed_at=null; end if; return new; end; $$;
drop trigger if exists projects_touch_updated_at on public.projects; create trigger projects_touch_updated_at before update on public.projects for each row execute function public.touch_project_updated_at();
drop trigger if exists project_milestones_touch_updated_at on public.project_milestones; create trigger project_milestones_touch_updated_at before update on public.project_milestones for each row execute function public.touch_project_milestone_updated_at();

alter table public.projects enable row level security;
alter table public.project_milestones enable row level security;
grant select,insert,update,delete on public.projects to authenticated;
grant select,insert,update,delete on public.project_milestones to authenticated;
grant all on public.projects to service_role;
grant all on public.project_milestones to service_role;

drop policy if exists "projects_select_internal" on public.projects;
create policy "projects_select_internal" on public.projects for select to authenticated using (public.is_internal_member());
drop policy if exists "projects_insert_internal" on public.projects;
create policy "projects_insert_internal" on public.projects for insert to authenticated with check (public.is_internal_member() and created_by=auth.uid());
drop policy if exists "projects_update_internal" on public.projects;
create policy "projects_update_internal" on public.projects for update to authenticated using (public.is_internal_member()) with check (public.is_internal_member());
drop policy if exists "projects_delete_own_or_founder" on public.projects;
create policy "projects_delete_own_or_founder" on public.projects for delete to authenticated using (public.can_delete_owned_or_founder(created_by));

drop policy if exists "project_milestones_select_internal" on public.project_milestones;
create policy "project_milestones_select_internal" on public.project_milestones for select to authenticated using (public.is_internal_member());
drop policy if exists "project_milestones_insert_internal" on public.project_milestones;
create policy "project_milestones_insert_internal" on public.project_milestones for insert to authenticated with check (public.is_internal_member() and created_by=auth.uid());
drop policy if exists "project_milestones_update_internal" on public.project_milestones;
create policy "project_milestones_update_internal" on public.project_milestones for update to authenticated using (public.is_internal_member()) with check (public.is_internal_member());
drop policy if exists "project_milestones_delete_internal" on public.project_milestones;
create policy "project_milestones_delete_internal" on public.project_milestones for delete to authenticated using (public.is_internal_member());

comment on table public.projects is 'Shared Moscatelli Operations workstreams: ownership, status, dates, and next action.';
comment on table public.project_milestones is 'Shared milestones belonging to MainHub Operations projects.';
comment on column public.calendar_events.project_id is 'Optional link from a calendar event to an Operations project.';

notify pgrst,'reload schema';

do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='projects') then alter publication supabase_realtime add table public.projects; end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='project_milestones') then alter publication supabase_realtime add table public.project_milestones; end if;
  end if;
end $$;
