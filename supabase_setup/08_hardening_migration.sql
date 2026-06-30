-- MOSCATELLI — Hardening migration for existing Patch 7/8 Supabase projects
-- Run this only if you already ran the earlier setup files.
-- Fresh projects can use 01_schema.sql, 02_rls_policies.sql, 03_storage.sql directly.

alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users(id) on delete restrict;

alter table public.record_posts drop constraint if exists record_posts_created_by_fkey;
alter table public.record_posts
  add constraint record_posts_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete restrict;

alter table public.record_attachments drop constraint if exists record_attachments_created_by_fkey;
alter table public.record_attachments
  add constraint record_attachments_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete restrict;

alter table public.desk_messages drop constraint if exists desk_messages_created_by_fkey;
alter table public.desk_messages
  add constraint desk_messages_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete restrict;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'record_attachments_bucket_check'
      and conrelid = 'public.record_attachments'::regclass
  ) then
    alter table public.record_attachments
      add constraint record_attachments_bucket_check
      check (bucket = 'record-attachments');
  end if;
end $$;

comment on column public.record_attachments.preview_url is
  'Optional temporary/signed preview URL only. Do not store public URLs for private Record objects.';

create or replace function public.can_delete_owned_or_founder(owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.is_internal_member() and (owner_id = auth.uid() or public.is_founder()), false);
$$;

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
  select rp.created_by into post_owner
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
    array_length(p, 1) >= 3
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
