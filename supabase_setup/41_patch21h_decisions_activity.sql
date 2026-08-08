-- MOSCATELLI MainHub Patch 21H
-- Structured Decisions inside The Record + immutable institutional Activity history.
-- Run after Patch 21G / 40_patch21g_suppliers_partners.sql.

begin;

alter table public.record_posts
  add column if not exists decision_number bigint,
  add column if not exists decision_date date,
  add column if not exists decision_owner_id uuid references public.profiles(id) on delete set null,
  add column if not exists decision_owner_display text,
  add column if not exists related_project_id uuid references public.projects(id) on delete set null,
  add column if not exists related_project_name text,
  add column if not exists related_product_id uuid references public.products(id) on delete set null,
  add column if not exists related_product_name text,
  add column if not exists related_supplier_id uuid references public.suppliers(id) on delete set null,
  add column if not exists related_supplier_name text;

create sequence if not exists public.record_decision_number_seq;

with existing as (
  select coalesce(max(decision_number), 0)::bigint as base
  from public.record_posts
  where decision_number is not null
), ranked as (
  select p.id, existing.base + row_number() over (order by p.created_at, p.id)::bigint as rn
  from public.record_posts p
  cross join existing
  where p.category = 'decisions' and p.decision_number is null
)
update public.record_posts p
set decision_number = ranked.rn
from ranked
where p.id = ranked.id;

update public.record_posts p
set decision_date = coalesce(p.decision_date, p.created_at::date),
    decision_owner_id = coalesce(p.decision_owner_id, p.created_by),
    decision_owner_display = coalesce(nullif(p.decision_owner_display, ''), prof.display_name, '')
from public.profiles prof
where p.category = 'decisions'
  and prof.id = p.created_by;

select setval(
  'public.record_decision_number_seq',
  greatest(coalesce((select max(decision_number) from public.record_posts where category = 'decisions'), 0) + 1, 1),
  false
);

create unique index if not exists record_posts_decision_number_unique
  on public.record_posts(decision_number)
  where decision_number is not null;
create index if not exists record_posts_decision_date_idx
  on public.record_posts(decision_date desc)
  where category = 'decisions';

create or replace function public.assign_record_decision_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.category = 'decisions' then
    -- Decision references are database-owned: clients cannot choose or renumber them.
    if tg_op = 'INSERT' then
      new.decision_number := nextval('public.record_decision_number_seq');
    elsif old.category is distinct from 'decisions' then
      new.decision_number := nextval('public.record_decision_number_seq');
    else
      new.decision_number := old.decision_number;
      if new.decision_number is null then
        new.decision_number := nextval('public.record_decision_number_seq');
      end if;
    end if;

    new.decision_date := coalesce(new.decision_date, current_date);
    if new.decision_owner_id is null then new.decision_owner_id := new.created_by; end if;
    if coalesce(new.decision_owner_display, '') = '' and new.decision_owner_id is not null then
      select display_name into new.decision_owner_display from public.profiles where id = new.decision_owner_id;
    end if;
  else
    -- A non-decision post must not retain orphaned decision metadata.
    new.decision_number := null;
    new.decision_date := null;
    new.decision_owner_id := null;
    new.decision_owner_display := null;
    new.related_project_id := null;
    new.related_project_name := null;
    new.related_product_id := null;
    new.related_product_name := null;
    new.related_supplier_id := null;
    new.related_supplier_name := null;
  end if;
  return new;
end;
$$;

revoke all on function public.assign_record_decision_number() from public;
revoke all on function public.assign_record_decision_number() from authenticated;

drop trigger if exists trg_record_posts_decision_number on public.record_posts;
create trigger trg_record_posts_decision_number
before insert or update
on public.record_posts
for each row execute function public.assign_record_decision_number();

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_display text not null default '',
  entity_type text not null,
  entity_id uuid,
  action text not null check (action in ('created','updated','deleted','completed','reopened')),
  entity_label text not null default '',
  context jsonb not null default '{}'::jsonb
);

create index if not exists activity_events_created_at_idx on public.activity_events(created_at desc);
create index if not exists activity_events_entity_idx on public.activity_events(entity_type, entity_id, created_at desc);

alter table public.activity_events enable row level security;
grant select on public.activity_events to authenticated;
revoke insert, update, delete on public.activity_events from authenticated;
grant all on public.activity_events to service_role;

drop policy if exists "activity_events_select_internal" on public.activity_events;
create policy "activity_events_select_internal"
on public.activity_events
for select
to authenticated
using (public.is_internal_member());

create or replace function public.log_mainhub_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_json jsonb;
  old_json jsonb;
  actor uuid := auth.uid();
  actor_name text := '';
  entity text := coalesce(tg_argv[0], tg_table_name);
  action_name text;
  label text := '';
  entity_uuid uuid;
begin
  if tg_op = 'UPDATE' then
    if (to_jsonb(new) - 'updated_at' - 'completed_at') = (to_jsonb(old) - 'updated_at' - 'completed_at') then
      return new;
    end if;
    row_json := to_jsonb(new);
    old_json := to_jsonb(old);
    action_name := 'updated';
  elsif tg_op = 'INSERT' then
    row_json := to_jsonb(new);
    action_name := 'created';
  else
    row_json := to_jsonb(old);
    action_name := 'deleted';
  end if;

  if actor is not null then
    select coalesce(display_name, '') into actor_name from public.profiles where id = actor;
  end if;
  if actor_name = '' then actor_name := 'System'; end if;

  -- Suppress referential-action noise. Parent deletion is the meaningful event;
  -- automatic SET NULL / CASCADE housekeeping should not flood Activity.
  if tg_op = 'DELETE' and tg_table_name = 'project_milestones' then
    if not exists (select 1 from public.projects where id = nullif(row_json->>'project_id','')::uuid) then return old; end if;
  end if;
  if tg_op = 'DELETE' and tg_table_name = 'product_revisions' then
    if not exists (select 1 from public.products where id = nullif(row_json->>'product_id','')::uuid) then return old; end if;
  end if;
  if tg_op = 'UPDATE' and tg_table_name = 'calendar_events'
     and nullif(old_json->>'project_id','') is not null
     and nullif(row_json->>'project_id','') is null
     and not exists (select 1 from public.projects where id = nullif(old_json->>'project_id','')::uuid)
     and (row_json - 'updated_at' - 'project_id') = (old_json - 'updated_at' - 'project_id') then
    return new;
  end if;
  if tg_op = 'UPDATE' and tg_table_name = 'products' then
    if nullif(old_json->>'lot_id','') is not null
       and nullif(row_json->>'lot_id','') is null
       and not exists (select 1 from public.product_lots where id = nullif(old_json->>'lot_id','')::uuid)
       and (row_json - 'updated_at' - 'lot_id') = (old_json - 'updated_at' - 'lot_id') then
      return new;
    end if;
    if nullif(old_json->>'project_id','') is not null
       and nullif(row_json->>'project_id','') is null
       and not exists (select 1 from public.projects where id = nullif(old_json->>'project_id','')::uuid)
       and (row_json - 'updated_at' - 'project_id') = (old_json - 'updated_at' - 'project_id') then
      return new;
    end if;
    if nullif(old_json->>'supplier_id','') is not null
       and nullif(row_json->>'supplier_id','') is null
       and not exists (select 1 from public.suppliers where id = nullif(old_json->>'supplier_id','')::uuid)
       and (row_json - 'updated_at' - 'supplier_id') = (old_json - 'updated_at' - 'supplier_id') then
      return new;
    end if;
  end if;
  if tg_op = 'UPDATE' and tg_table_name = 'record_posts' and coalesce(row_json->>'category','') = 'decisions' then
    if nullif(old_json->>'related_project_id','') is not null
       and nullif(row_json->>'related_project_id','') is null
       and not exists (select 1 from public.projects where id = nullif(old_json->>'related_project_id','')::uuid)
       and (row_json - 'updated_at' - 'related_project_id') = (old_json - 'updated_at' - 'related_project_id') then
      return new;
    end if;
    if nullif(old_json->>'related_product_id','') is not null
       and nullif(row_json->>'related_product_id','') is null
       and not exists (select 1 from public.products where id = nullif(old_json->>'related_product_id','')::uuid)
       and (row_json - 'updated_at' - 'related_product_id') = (old_json - 'updated_at' - 'related_product_id') then
      return new;
    end if;
    if nullif(old_json->>'related_supplier_id','') is not null
       and nullif(row_json->>'related_supplier_id','') is null
       and not exists (select 1 from public.suppliers where id = nullif(old_json->>'related_supplier_id','')::uuid)
       and (row_json - 'updated_at' - 'related_supplier_id') = (old_json - 'updated_at' - 'related_supplier_id') then
      return new;
    end if;
  end if;

  if tg_table_name = 'record_posts' then
    if coalesce(row_json->>'category','') = 'decisions' then entity := 'decision'; else entity := 'record'; end if;
    label := coalesce(row_json->>'title','');
    if entity = 'decision' and coalesce(row_json->>'decision_number','') <> '' then
      label := 'D-' || lpad(row_json->>'decision_number', 3, '0') || ' · ' || label;
    end if;
  elsif tg_table_name = 'calendar_events' then
    entity := 'calendar'; label := coalesce(row_json->>'title','');
  elsif tg_table_name = 'finance_entries' then
    entity := 'finance'; label := coalesce(row_json->>'description','');
  elsif tg_table_name = 'projects' then
    entity := 'project'; label := coalesce(row_json->>'name','');
  elsif tg_table_name = 'project_milestones' then
    entity := 'milestone'; label := coalesce(row_json->>'title','');
    if tg_op = 'UPDATE' and coalesce((old_json->>'completed')::boolean,false) is distinct from coalesce((row_json->>'completed')::boolean,false) then
      action_name := case when coalesce((row_json->>'completed')::boolean,false) then 'completed' else 'reopened' end;
    end if;
  elsif tg_table_name = 'product_lots' then
    entity := 'lotto'; label := coalesce(row_json->>'name','');
  elsif tg_table_name = 'products' then
    entity := 'product'; label := coalesce(row_json->>'name','');
  elsif tg_table_name = 'product_revisions' then
    entity := 'revision'; label := coalesce(row_json->>'revision_label','');
  elsif tg_table_name = 'suppliers' then
    entity := 'supplier'; label := coalesce(row_json->>'name','');
  end if;

  begin
    entity_uuid := nullif(row_json->>'id','')::uuid;
  exception when others then
    entity_uuid := null;
  end;

  insert into public.activity_events(actor_id, actor_display, entity_type, entity_id, action, entity_label, context)
  values (actor, actor_name, entity, entity_uuid, action_name, label, jsonb_build_object('table', tg_table_name));

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.log_mainhub_activity() from public;
revoke all on function public.log_mainhub_activity() from authenticated;

-- Recreate activity triggers idempotently.
do $$
declare
  t text;
begin
  foreach t in array array['record_posts','calendar_events','finance_entries','projects','project_milestones','product_lots','products','product_revisions','suppliers']
  loop
    execute format('drop trigger if exists trg_activity_%I on public.%I', t, t);
    execute format('create trigger trg_activity_%I after insert or update or delete on public.%I for each row execute function public.log_mainhub_activity()', t, t);
  end loop;
end $$;

-- Realtime activity is read-only to clients; it simply informs the UI that a new audit row exists.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'activity_events'
     ) then
    alter publication supabase_realtime add table public.activity_events;
  end if;
end $$;

comment on table public.activity_events is
  'Immutable, database-generated history of meaningful MainHub changes. It is not a chat feed and authenticated clients cannot write to it directly.';

notify pgrst, 'reload schema';
commit;
