-- MOSCATELLI MainHub — Patch 21G Suppliers / Partners
-- Run after Patch 21F Product Development.
-- Creates one canonical supplier/partner directory and adds an optional
-- product -> supplier relationship without rewriting historical supplier_name text.

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 180),
  category text not null default 'other' check (category in ('textile_mill','atelier','packaging','manufacturer','logistics','photography','consultant','other')),
  status text not null default 'prospect' check (status in ('prospect','active','preferred','paused','inactive')),
  location text not null default '' check (char_length(location) <= 180),
  primary_contact text not null default '' check (char_length(primary_contact) <= 160),
  email text not null default '' check (char_length(email) <= 254),
  phone text not null default '' check (char_length(phone) <= 80),
  website text not null default '' check (char_length(website) <= 320),
  services text not null default '' check (char_length(services) <= 600),
  last_contact_date date,
  next_action text not null default '' check (char_length(next_action) <= 600),
  notes text not null default '' check (char_length(notes) <= 2400)
);

alter table public.products
  add column if not exists supplier_id uuid;

-- Add the FK idempotently. ON DELETE SET NULL deliberately preserves the
-- product dossier and its supplier_name snapshot if a supplier record is removed.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_supplier_id_fkey'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_supplier_id_fkey
      foreign key (supplier_id)
      references public.suppliers(id)
      on delete set null;
  end if;
end $$;

create index if not exists suppliers_name_idx on public.suppliers (lower(name));
create index if not exists suppliers_status_idx on public.suppliers (status, name);
create index if not exists suppliers_category_idx on public.suppliers (category, name);
create index if not exists products_supplier_idx on public.products (supplier_id) where supplier_id is not null;

create or replace function public.touch_supplier_updated_at()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  new.created_by = old.created_by;
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists suppliers_touch_updated_at on public.suppliers;
create trigger suppliers_touch_updated_at
before update on public.suppliers
for each row execute function public.touch_supplier_updated_at();

alter table public.suppliers enable row level security;

grant select,insert,update,delete on public.suppliers to authenticated;
grant all on public.suppliers to service_role;

drop policy if exists "suppliers_internal_select" on public.suppliers;
create policy "suppliers_internal_select"
on public.suppliers for select to authenticated
using (public.is_internal_member());

drop policy if exists "suppliers_internal_insert" on public.suppliers;
create policy "suppliers_internal_insert"
on public.suppliers for insert to authenticated
with check (public.is_internal_member() and created_by = auth.uid());

drop policy if exists "suppliers_internal_update" on public.suppliers;
create policy "suppliers_internal_update"
on public.suppliers for update to authenticated
using (public.is_internal_member())
with check (public.is_internal_member());

drop policy if exists "suppliers_delete_own_or_founder" on public.suppliers;
create policy "suppliers_delete_own_or_founder"
on public.suppliers for delete to authenticated
using (public.can_delete_owned_or_founder(created_by));

comment on table public.suppliers is 'Canonical MainHub directory for Moscatelli suppliers, mills, ateliers and external partners.';
comment on column public.products.supplier_id is 'Optional canonical supplier relationship. Historical supplier_name is preserved as a readable snapshot / legacy reference.';
comment on column public.products.supplier_name is 'Readable supplier-name snapshot or legacy unlinked reference; never auto-matched by name to suppliers.';

notify pgrst, 'reload schema';

do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename='suppliers'
    ) then
      alter publication supabase_realtime add table public.suppliers;
    end if;
  end if;
end $$;
