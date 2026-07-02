-- Patch 13J — security and deployment hardening
-- Purpose:
-- 1. Make The Desk soft-delete only. The UI already soft-deletes by updating deleted_at/deleted_by.
-- 2. Remove hard-delete capability from authenticated browser clients.
-- 3. Keep shared Desk select/insert/update permissions intact.
--
-- Safe to rerun.

begin;

-- The Desk should preserve correspondence traces. Hard deletion is not part of the browser workflow.
drop policy if exists "desk_messages_delete_own_or_founder" on public.desk_messages;
revoke delete on table public.desk_messages from authenticated;

-- Reassert only the permissions the browser needs for The Desk.
grant select, insert, update on table public.desk_messages to authenticated;

-- Keep helper-function access explicit for RLS policies.
grant execute on function public.is_internal_member() to authenticated;
grant execute on function public.can_delete_owned_or_founder(uuid) to authenticated;

commit;

-- Validation: this should return no DELETE privilege and no desk_messages delete policy.
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'desk_messages'
  and grantee = 'authenticated'
order by privilege_type;

select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'desk_messages'
order by policyname;
