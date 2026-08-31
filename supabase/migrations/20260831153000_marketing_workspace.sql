-- MOSCATELLI MainHub — Marketing workspace
-- Shared internal registers for social publishing, networking contacts,
-- and offline marketing projects.

create table if not exists public.marketing_social_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  platform text not null check (platform in ('instagram','youtube','facebook','tiktok')),
  item_type text not null check (item_type in ('post','ad')),
  title text not null check (length(trim(title)) between 1 and 160),
  status text not null default 'idea' check (status in ('idea','draft','scheduled','published','paused','completed')),
  owner text not null default '' check (length(owner) <= 120),
  scheduled_for timestamptz,
  campaign_name text not null default '' check (length(campaign_name) <= 160),
  objective text not null default '' check (length(objective) <= 600),
  content text not null default '' check (length(content) <= 4000),
  destination_url text not null default '' check (length(destination_url) <= 600),
  budget numeric(12,2) check (budget is null or budget >= 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$')
);

create table if not exists public.marketing_contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  full_name text not null check (length(trim(full_name)) between 1 and 180),
  organisation text not null default '' check (length(organisation) <= 180),
  role_area text not null default '' check (length(role_area) <= 180),
  country text not null default '' check (length(country) <= 120),
  city text not null default '' check (length(city) <= 120),
  relationship_stage text not null default 'prospect' check (relationship_stage in ('prospect','introduced','active','partner','dormant')),
  email text not null default '' check (length(email) <= 254),
  phone text not null default '' check (length(phone) <= 80),
  instagram_url text not null default '' check (length(instagram_url) <= 600),
  linkedin_url text not null default '' check (length(linkedin_url) <= 600),
  website_url text not null default '' check (length(website_url) <= 600),
  notes text not null default '' check (length(notes) <= 3000)
);

create table if not exists public.marketing_projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  title text not null check (length(trim(title)) between 1 and 180),
  status text not null default 'future' check (status in ('future','ongoing','completed')),
  project_type text not null default 'other' check (project_type in ('campaign','partnership','event','editorial','networking','other')),
  lead text not null default '' check (length(lead) <= 120),
  country text not null default '' check (length(country) <= 120),
  start_date date,
  target_date date,
  budget numeric(12,2) check (budget is null or budget >= 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  objective text not null default '' check (length(objective) <= 1200),
  next_action text not null default '' check (length(next_action) <= 600),
  notes text not null default '' check (length(notes) <= 3000),
  constraint marketing_projects_date_order check (start_date is null or target_date is null or target_date >= start_date)
);

create index if not exists marketing_social_platform_type_status_idx
  on public.marketing_social_items(platform, item_type, status, scheduled_for);
create index if not exists marketing_social_updated_idx
  on public.marketing_social_items(updated_at desc);
create index if not exists marketing_contacts_stage_country_idx
  on public.marketing_contacts(relationship_stage, country, full_name);
create index if not exists marketing_contacts_name_idx
  on public.marketing_contacts(lower(full_name));
create index if not exists marketing_projects_status_target_idx
  on public.marketing_projects(status, target_date);

create or replace function public.touch_marketing_record_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.created_by = old.created_by;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists marketing_social_items_touch_updated_at on public.marketing_social_items;
create trigger marketing_social_items_touch_updated_at
before update on public.marketing_social_items
for each row execute function public.touch_marketing_record_updated_at();

drop trigger if exists marketing_contacts_touch_updated_at on public.marketing_contacts;
create trigger marketing_contacts_touch_updated_at
before update on public.marketing_contacts
for each row execute function public.touch_marketing_record_updated_at();

drop trigger if exists marketing_projects_touch_updated_at on public.marketing_projects;
create trigger marketing_projects_touch_updated_at
before update on public.marketing_projects
for each row execute function public.touch_marketing_record_updated_at();

alter table public.marketing_social_items enable row level security;
alter table public.marketing_contacts enable row level security;
alter table public.marketing_projects enable row level security;

revoke all on public.marketing_social_items from anon;
revoke all on public.marketing_contacts from anon;
revoke all on public.marketing_projects from anon;
grant select, insert, update, delete on public.marketing_social_items to authenticated;
grant select, insert, update, delete on public.marketing_contacts to authenticated;
grant select, insert, update, delete on public.marketing_projects to authenticated;
grant all on public.marketing_social_items to service_role;
grant all on public.marketing_contacts to service_role;
grant all on public.marketing_projects to service_role;

drop policy if exists marketing_social_select_internal on public.marketing_social_items;
create policy marketing_social_select_internal on public.marketing_social_items
for select to authenticated using (public.is_internal_member());
drop policy if exists marketing_social_insert_internal on public.marketing_social_items;
create policy marketing_social_insert_internal on public.marketing_social_items
for insert to authenticated with check (public.is_internal_member() and created_by = auth.uid());
drop policy if exists marketing_social_update_internal on public.marketing_social_items;
create policy marketing_social_update_internal on public.marketing_social_items
for update to authenticated using (public.is_internal_member()) with check (public.is_internal_member());
drop policy if exists marketing_social_delete_own_or_founder on public.marketing_social_items;
create policy marketing_social_delete_own_or_founder on public.marketing_social_items
for delete to authenticated using (public.can_delete_owned_or_founder(created_by));

drop policy if exists marketing_contacts_select_internal on public.marketing_contacts;
create policy marketing_contacts_select_internal on public.marketing_contacts
for select to authenticated using (public.is_internal_member());
drop policy if exists marketing_contacts_insert_internal on public.marketing_contacts;
create policy marketing_contacts_insert_internal on public.marketing_contacts
for insert to authenticated with check (public.is_internal_member() and created_by = auth.uid());
drop policy if exists marketing_contacts_update_internal on public.marketing_contacts;
create policy marketing_contacts_update_internal on public.marketing_contacts
for update to authenticated using (public.is_internal_member()) with check (public.is_internal_member());
drop policy if exists marketing_contacts_delete_own_or_founder on public.marketing_contacts;
create policy marketing_contacts_delete_own_or_founder on public.marketing_contacts
for delete to authenticated using (public.can_delete_owned_or_founder(created_by));

drop policy if exists marketing_projects_select_internal on public.marketing_projects;
create policy marketing_projects_select_internal on public.marketing_projects
for select to authenticated using (public.is_internal_member());
drop policy if exists marketing_projects_insert_internal on public.marketing_projects;
create policy marketing_projects_insert_internal on public.marketing_projects
for insert to authenticated with check (public.is_internal_member() and created_by = auth.uid());
drop policy if exists marketing_projects_update_internal on public.marketing_projects;
create policy marketing_projects_update_internal on public.marketing_projects
for update to authenticated using (public.is_internal_member()) with check (public.is_internal_member());
drop policy if exists marketing_projects_delete_own_or_founder on public.marketing_projects;
create policy marketing_projects_delete_own_or_founder on public.marketing_projects
for delete to authenticated using (public.can_delete_owned_or_founder(created_by));

comment on table public.marketing_social_items is 'MainHub Marketing register for social posts and advertisements by platform.';
comment on table public.marketing_contacts is 'MainHub Offline Marketing networking and relationship directory.';
comment on table public.marketing_projects is 'MainHub Offline Marketing initiatives and collaborations.';

notify pgrst, 'reload schema';

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='marketing_social_items') then
      alter publication supabase_realtime add table public.marketing_social_items;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='marketing_contacts') then
      alter publication supabase_realtime add table public.marketing_contacts;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='marketing_projects') then
      alter publication supabase_realtime add table public.marketing_projects;
    end if;
  end if;
end;
$$;
