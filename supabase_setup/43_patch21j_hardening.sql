-- MOSCATELLI MainHub Patch 21J — cumulative hardening
-- Safe to run after 41/42. This patch is intentionally idempotent and also
-- protects installations where Patch 21H was applied before the 21J audit.

begin;

-- Normalise any stray decision metadata that may have been written to ordinary
-- Record entries before decision references became database-owned.
update public.record_posts
set decision_number = null,
    decision_date = null,
    decision_owner_id = null,
    decision_owner_display = null,
    related_project_id = null,
    related_project_name = null,
    related_product_id = null,
    related_product_name = null,
    related_supplier_id = null,
    related_supplier_name = null
where category <> 'decisions'
  and (
    decision_number is not null
    or decision_date is not null
    or decision_owner_id is not null
    or decision_owner_display is not null
    or related_project_id is not null
    or related_project_name is not null
    or related_product_id is not null
    or related_product_name is not null
    or related_supplier_id is not null
    or related_supplier_name is not null
  );

create or replace function public.assign_record_decision_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.category = 'decisions' then
    -- The reference is immutable and allocated only by the database. This
    -- prevents an authenticated client from choosing or renumbering D-numbers.
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
      select display_name into new.decision_owner_display
      from public.profiles
      where id = new.decision_owner_id;
    end if;
  else
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

-- A non-decision must never carry a D-number. The trigger handles normal writes;
-- the constraint provides a second database-level integrity boundary.
alter table public.record_posts
  drop constraint if exists record_posts_decision_number_category;
alter table public.record_posts
  add constraint record_posts_decision_number_category
  check (category = 'decisions' or decision_number is null);

-- Keep Activity Realtime registration genuinely idempotent, including projects
-- where the publication is absent or has been customised.
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

notify pgrst, 'reload schema';
commit;
