-- Patch 12D — Desk soft-delete support
-- Run once after Patch 12D deployment.
-- Adds WhatsApp-style deleted-message placeholders without hard-deleting rows.

begin;

alter table public.desk_messages
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete restrict,
  add column if not exists deleted_by_display text not null default '';

create index if not exists desk_messages_deleted_at_idx
  on public.desk_messages (deleted_at)
  where deleted_at is not null;

create or replace function public.set_desk_message_delete_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  deleter_display_value text;
begin
  -- A non-deleted message should not carry deletion metadata.
  if new.deleted_at is null then
    new.deleted_by := null;
    new.deleted_by_display := '';
    return new;
  end if;

  -- Soft deletion must be explicit and attributed.
  if new.deleted_by is null then
    new.deleted_by := auth.uid();
  end if;

  select p.display_name
  into deleter_display_value
  from public.profiles p
  where p.id = new.deleted_by
    and p.is_active = true;

  if deleter_display_value is null then
    raise exception 'desk_messages.deleted_by must belong to an active profile';
  end if;

  new.deleted_by_display := deleter_display_value;
  new.body := '';

  return new;
end;
$$;

drop trigger if exists set_desk_message_delete_snapshot on public.desk_messages;
create trigger set_desk_message_delete_snapshot
before update of deleted_at, deleted_by, body on public.desk_messages
for each row
execute function public.set_desk_message_delete_snapshot();

-- Keep table privileges explicit. RLS policies continue to restrict rows.
grant select, insert, update, delete on table public.desk_messages to authenticated;
grant execute on function public.set_desk_message_delete_snapshot() to authenticated;

commit;
