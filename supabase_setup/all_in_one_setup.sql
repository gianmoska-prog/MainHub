-- MOSCATELLI — All-in-one Supabase setup
-- Prefer the separate numbered files for easier debugging.
-- This file combines 01_schema.sql, 02_rls_policies.sql and 03_storage.sql.
-- It does not activate individual users; run 04_seed_profiles_template.sql separately after Auth users exist.


-- ============================================================
-- 01_schema.sql
-- ============================================================

-- MOSCATELLI — Supabase schema
-- Run first in the Supabase SQL editor.
-- This creates the public tables, helper trigger, and updated_at function.

create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  email citext unique,
  display_name text not null default 'Member',
  role text not null default 'member' check (role in ('founder', 'partner', 'member')),
  division text not null default 'all',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.record_posts (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'record',
  category text not null default 'meetings' check (
    category in ('meetings', 'ideas', 'decisions', 'tasks', 'product', 'brand', 'finance', 'operations')
  ),
  title text not null default 'Untitled entry',
  body text not null default '—',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists record_posts_created_at_idx on public.record_posts (created_at desc);
create index if not exists record_posts_category_idx on public.record_posts (category);
create index if not exists record_posts_created_by_idx on public.record_posts (created_by);

create table if not exists public.record_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.record_posts(id) on delete cascade,
  bucket text not null default 'record-attachments' check (bucket = 'record-attachments'),
  path text not null unique,
  preview_url text,
  original_size integer not null default 0 check (original_size >= 0),
  resized_size integer not null default 0 check (resized_size >= 0),
  mime_type text not null default 'image/jpeg',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists record_attachments_post_id_idx on public.record_attachments (post_id);
create index if not exists record_attachments_created_by_idx on public.record_attachments (created_by);

create table if not exists public.desk_messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'desk',
  body text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  sender_display text not null default 'Member',
  sender_role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists desk_messages_created_at_idx on public.desk_messages (created_at asc);
create index if not exists desk_messages_channel_idx on public.desk_messages (channel);
create index if not exists desk_messages_created_by_idx on public.desk_messages (created_by);

comment on column public.record_attachments.preview_url is
  'Optional temporary/signed preview URL only. Do not store public URLs for private Record objects.';

create or replace function public.validate_record_attachment_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_owner uuid;
  expected_prefix text;
begin
  select rp.created_by
  into post_owner
  from public.record_posts rp
  where rp.id = new.post_id;

  if post_owner is null then
    raise exception 'record_attachments.post_id must reference an existing record post';
  end if;

  if new.created_by <> post_owner then
    raise exception 'record_attachments.created_by must match the owning record post';
  end if;

  if new.bucket <> 'record-attachments' then
    raise exception 'record_attachments.bucket must be record-attachments';
  end if;

  expected_prefix := new.created_by::text || '/' || new.post_id::text || '/';

  if new.path is null or new.path not like expected_prefix || '%' then
    raise exception 'record attachment path must use {created_by}/{post_id}/{filename}';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_record_attachment_metadata on public.record_attachments;
create trigger validate_record_attachment_metadata
before insert or update on public.record_attachments
for each row execute function public.validate_record_attachment_metadata();

create or replace function public.set_desk_message_sender_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_display_value text;
  sender_role_value text;
begin
  select p.display_name, p.role
  into sender_display_value, sender_role_value
  from public.profiles p
  where p.id = new.created_by
    and p.is_active = true;

  if sender_display_value is null then
    raise exception 'desk_messages.created_by must belong to an active profile';
  end if;

  if tg_op = 'INSERT' then
    new.sender_display := sender_display_value;
    new.sender_role := sender_role_value;
  elsif new.created_by is distinct from old.created_by
    or new.sender_display is distinct from old.sender_display
    or new.sender_role is distinct from old.sender_role then
    new.sender_display := sender_display_value;
    new.sender_role := sender_role_value;
  end if;

  return new;
end;
$$;

drop trigger if exists set_desk_message_sender_snapshot on public.desk_messages;
create trigger set_desk_message_sender_snapshot
before insert or update on public.desk_messages
for each row execute function public.set_desk_message_sender_snapshot();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_record_posts_updated_at on public.record_posts;
create trigger set_record_posts_updated_at
before update on public.record_posts
for each row execute function public.set_updated_at();

drop trigger if exists set_desk_messages_updated_at on public.desk_messages;
create trigger set_desk_messages_updated_at
before update on public.desk_messages
for each row execute function public.set_updated_at();

-- New auth users are created as inactive members by default.
-- This lets you invite/create users first, then deliberately activate them in profiles.
create or replace function public.handle_new_internal_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role, division, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'member'), '@', 1)),
    'member',
    'all',
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_internal_profile on auth.users;
create trigger on_auth_user_created_create_internal_profile
after insert on auth.users
for each row execute function public.handle_new_internal_user();


-- ============================================================
-- 02_rls_policies.sql
-- ============================================================

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


-- ============================================================
-- 03_storage.sql
-- ============================================================

-- MOSCATELLI — Supabase Storage setup
-- Run after 01_schema.sql and 02_rls_policies.sql.
-- Uses a private bucket for The Record attachments.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'record-attachments',
  'record-attachments',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage object policies
-- Expected upload path:
--   {auth.uid()}/{post_id}/{filename}
--
-- Example:
--   1f6...uuid/8a2...post/attachment-001.jpg

create or replace function public.record_attachment_object_matches_post(
  object_name text,
  allow_founder boolean default false
)
returns boolean
language sql
stable
security definer
set search_path = public, storage
as $$
  with parts as (
    select storage.foldername(object_name) as p
  )
  select coalesce(
    array_length(p, 1) >= 2
    and exists (
      select 1
      from public.record_posts rp
      where rp.id::text = p[2]
        and rp.created_by::text = p[1]
        and (
          p[1] = auth.uid()::text
          or (allow_founder and public.is_founder())
        )
    ),
    false
  )
  from parts;
$$;

drop policy if exists "record_attachment_objects_select_internal" on storage.objects;
create policy "record_attachment_objects_select_internal"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'record-attachments'
  and public.is_internal_member()
);

drop policy if exists "record_attachment_objects_insert_own_record_path" on storage.objects;
drop policy if exists "record_attachment_objects_insert_own_folder" on storage.objects;
create policy "record_attachment_objects_insert_own_record_path"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'record-attachments'
  and public.is_internal_member()
  and public.record_attachment_object_matches_post(name, false)
);

drop policy if exists "record_attachment_objects_update_own_record_path_or_founder" on storage.objects;
drop policy if exists "record_attachment_objects_update_own_folder_or_founder" on storage.objects;
create policy "record_attachment_objects_update_own_record_path_or_founder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'record-attachments'
  and public.is_internal_member()
  and public.record_attachment_object_matches_post(name, true)
)
with check (
  bucket_id = 'record-attachments'
  and public.is_internal_member()
  and public.record_attachment_object_matches_post(name, true)
);

drop policy if exists "record_attachment_objects_delete_own_record_path_or_founder" on storage.objects;
drop policy if exists "record_attachment_objects_delete_own_folder_or_founder" on storage.objects;
create policy "record_attachment_objects_delete_own_record_path_or_founder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'record-attachments'
  and public.is_internal_member()
  and public.record_attachment_object_matches_post(name, true)
);
