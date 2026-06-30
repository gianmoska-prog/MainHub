-- MOSCATELLI — Row Level Security policies
-- Run after 01_schema.sql.
-- These policies assume invite-only Auth and active profiles.

alter table public.profiles enable row level security;
alter table public.record_posts enable row level security;
alter table public.record_attachments enable row level security;
alter table public.desk_messages enable row level security;

-- Helper functions

create or replace function public.is_internal_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
  );
$$;

create or replace function public.current_internal_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and p.is_active = true
  limit 1;
$$;

create or replace function public.is_founder()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_internal_role() = 'founder', false);
$$;

create or replace function public.can_delete_owned_or_founder(owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.is_internal_member() and (owner_id = auth.uid() or public.is_founder()), false);
$$;

-- Profiles

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_select_active_internal" on public.profiles;
create policy "profiles_select_active_internal"
on public.profiles
for select
to authenticated
using (public.is_internal_member() and is_active = true);

drop policy if exists "profiles_founder_insert" on public.profiles;
create policy "profiles_founder_insert"
on public.profiles
for insert
to authenticated
with check (public.is_founder());

drop policy if exists "profiles_founder_update" on public.profiles;
create policy "profiles_founder_update"
on public.profiles
for update
to authenticated
using (public.is_founder())
with check (public.is_founder());

drop policy if exists "profiles_founder_delete" on public.profiles;
create policy "profiles_founder_delete"
on public.profiles
for delete
to authenticated
using (public.is_founder());

-- The Record

drop policy if exists "record_posts_select_internal" on public.record_posts;
create policy "record_posts_select_internal"
on public.record_posts
for select
to authenticated
using (public.is_internal_member());

drop policy if exists "record_posts_insert_internal" on public.record_posts;
create policy "record_posts_insert_internal"
on public.record_posts
for insert
to authenticated
with check (
  public.is_internal_member()
  and created_by = auth.uid()
);

drop policy if exists "record_posts_update_own_or_founder" on public.record_posts;
create policy "record_posts_update_own_or_founder"
on public.record_posts
for update
to authenticated
using (public.can_delete_owned_or_founder(created_by))
with check (public.can_delete_owned_or_founder(created_by));

drop policy if exists "record_posts_delete_own_or_founder" on public.record_posts;
create policy "record_posts_delete_own_or_founder"
on public.record_posts
for delete
to authenticated
using (public.can_delete_owned_or_founder(created_by));

-- Record attachments metadata

drop policy if exists "record_attachments_select_internal" on public.record_attachments;
create policy "record_attachments_select_internal"
on public.record_attachments
for select
to authenticated
using (public.is_internal_member());

drop policy if exists "record_attachments_insert_own_post" on public.record_attachments;
create policy "record_attachments_insert_own_post"
on public.record_attachments
for insert
to authenticated
with check (
  public.is_internal_member()
  and created_by = auth.uid()
  and exists (
    select 1
    from public.record_posts p
    where p.id = post_id
      and p.created_by = auth.uid()
  )
);

drop policy if exists "record_attachments_delete_own_or_founder" on public.record_attachments;
create policy "record_attachments_delete_own_or_founder"
on public.record_attachments
for delete
to authenticated
using (public.can_delete_owned_or_founder(created_by));

-- The Desk

drop policy if exists "desk_messages_select_internal" on public.desk_messages;
create policy "desk_messages_select_internal"
on public.desk_messages
for select
to authenticated
using (public.is_internal_member());

drop policy if exists "desk_messages_insert_internal" on public.desk_messages;
create policy "desk_messages_insert_internal"
on public.desk_messages
for insert
to authenticated
with check (
  public.is_internal_member()
  and created_by = auth.uid()
);

drop policy if exists "desk_messages_update_own_or_founder" on public.desk_messages;
create policy "desk_messages_update_own_or_founder"
on public.desk_messages
for update
to authenticated
using (public.can_delete_owned_or_founder(created_by))
with check (public.can_delete_owned_or_founder(created_by));

drop policy if exists "desk_messages_delete_own_or_founder" on public.desk_messages;
create policy "desk_messages_delete_own_or_founder"
on public.desk_messages
for delete
to authenticated
using (public.can_delete_owned_or_founder(created_by));
