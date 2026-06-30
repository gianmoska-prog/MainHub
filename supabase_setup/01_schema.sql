-- MOSCATELLI — Supabase schema
-- Run first in the Supabase SQL editor.
-- This creates the public tables, helper trigger, and updated_at function.

create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
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
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists record_posts_created_at_idx on public.record_posts (created_at desc);
create index if not exists record_posts_category_idx on public.record_posts (category);
create index if not exists record_posts_created_by_idx on public.record_posts (created_by);

create table if not exists public.record_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.record_posts(id) on delete cascade,
  bucket text not null default 'record-attachments',
  path text not null unique,
  preview_url text,
  original_size integer not null default 0 check (original_size >= 0),
  resized_size integer not null default 0 check (resized_size >= 0),
  mime_type text not null default 'image/jpeg',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists record_attachments_post_id_idx on public.record_attachments (post_id);
create index if not exists record_attachments_created_by_idx on public.record_attachments (created_by);

create table if not exists public.desk_messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'desk',
  body text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  sender_display text not null default 'Member',
  sender_role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists desk_messages_created_at_idx on public.desk_messages (created_at asc);
create index if not exists desk_messages_channel_idx on public.desk_messages (channel);
create index if not exists desk_messages_created_by_idx on public.desk_messages (created_by);

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
