-- MOSCATELLI MainHub — Patch 21F Product Development
-- Run after Patch 21D (projects/workstreams) and the existing profiles/internal-member helpers.

create table if not exists public.product_lots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 80),
  title text not null default '' check (char_length(title) <= 160),
  status text not null default 'planning' check (status in ('planning','active','completed','archived')),
  narrative text not null default '' check (char_length(narrative) <= 1200),
  sort_order integer not null default 0
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  lot_id uuid references public.product_lots(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  name text not null check (char_length(name) between 1 and 140),
  internal_ref text not null default '' check (char_length(internal_ref) <= 60),
  product_type text not null default '' check (char_length(product_type) <= 100),
  status text not null default 'concept' check (status in ('concept','development','sampling','approved','production','released','archived')),
  material text not null default '' check (char_length(material) <= 140),
  composition text not null default '' check (char_length(composition) <= 200),
  supplier_name text not null default '' check (char_length(supplier_name) <= 180),
  dimensions text not null default '' check (char_length(dimensions) <= 140),
  gsm numeric(10,2) check (gsm is null or gsm >= 0),
  colourways text not null default '' check (char_length(colourways) <= 420),
  sample_status text not null default 'not_started' check (sample_status in ('not_started','requested','in_transit','review','approved','rejected')),
  unit_cost numeric(14,2) check (unit_cost is null or unit_cost >= 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  moq integer check (moq is null or moq >= 0),
  target_retail numeric(14,2) check (target_retail is null or target_retail >= 0),
  target_margin numeric(6,2) check (target_margin is null or (target_margin >= 0 and target_margin <= 100)),
  next_action text not null default '' check (char_length(next_action) <= 600),
  notes text not null default '' check (char_length(notes) <= 2400)
);

create table if not exists public.product_revisions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  revision_label text not null check (char_length(revision_label) between 1 and 80),
  sample_date date,
  status text not null default 'review' check (status in ('review','approved','rejected','superseded')),
  summary text not null default '' check (char_length(summary) <= 420)
);

create index if not exists product_lots_sort_idx on public.product_lots(sort_order,name);
create index if not exists products_lot_idx on public.products(lot_id,updated_at desc);
create index if not exists products_project_idx on public.products(project_id) where project_id is not null;
create index if not exists products_status_idx on public.products(status,updated_at desc);
create index if not exists product_revisions_product_idx on public.product_revisions(product_id,sample_date desc nulls last,created_at desc);

-- Preserve authorship while allowing shared internal editing. The product/revision
-- relationships themselves remain editable only where the UI deliberately supports it.
create or replace function public.touch_product_lot_updated_at()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  new.created_by = old.created_by;
  new.updated_at = now();
  return new;
end; $$;

create or replace function public.touch_product_updated_at()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  new.created_by = old.created_by;
  new.updated_at = now();
  return new;
end; $$;

create or replace function public.touch_product_revision_updated_at()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  new.created_by = old.created_by;
  new.product_id = old.product_id;
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists product_lots_touch_updated_at on public.product_lots;
create trigger product_lots_touch_updated_at before update on public.product_lots for each row execute function public.touch_product_lot_updated_at();
drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at before update on public.products for each row execute function public.touch_product_updated_at();
drop trigger if exists product_revisions_touch_updated_at on public.product_revisions;
create trigger product_revisions_touch_updated_at before update on public.product_revisions for each row execute function public.touch_product_revision_updated_at();

alter table public.product_lots enable row level security;
alter table public.products enable row level security;
alter table public.product_revisions enable row level security;

grant select,insert,update,delete on public.product_lots to authenticated;
grant select,insert,update,delete on public.products to authenticated;
grant select,insert,delete on public.product_revisions to authenticated;
grant all on public.product_lots,public.products,public.product_revisions to service_role;

drop policy if exists "product_lots_internal_select" on public.product_lots;
create policy "product_lots_internal_select" on public.product_lots for select to authenticated using (public.is_internal_member());
drop policy if exists "product_lots_internal_insert" on public.product_lots;
create policy "product_lots_internal_insert" on public.product_lots for insert to authenticated with check (public.is_internal_member() and created_by=auth.uid());
drop policy if exists "product_lots_internal_update" on public.product_lots;
create policy "product_lots_internal_update" on public.product_lots for update to authenticated using (public.is_internal_member()) with check (public.is_internal_member());
drop policy if exists "product_lots_delete_own_or_founder" on public.product_lots;
create policy "product_lots_delete_own_or_founder" on public.product_lots for delete to authenticated using (public.can_delete_owned_or_founder(created_by));

drop policy if exists "products_internal_select" on public.products;
create policy "products_internal_select" on public.products for select to authenticated using (public.is_internal_member());
drop policy if exists "products_internal_insert" on public.products;
create policy "products_internal_insert" on public.products for insert to authenticated with check (public.is_internal_member() and created_by=auth.uid());
drop policy if exists "products_internal_update" on public.products;
create policy "products_internal_update" on public.products for update to authenticated using (public.is_internal_member()) with check (public.is_internal_member());
drop policy if exists "products_delete_own_or_founder" on public.products;
create policy "products_delete_own_or_founder" on public.products for delete to authenticated using (public.can_delete_owned_or_founder(created_by));

drop policy if exists "product_revisions_internal_select" on public.product_revisions;
create policy "product_revisions_internal_select" on public.product_revisions for select to authenticated using (public.is_internal_member());
drop policy if exists "product_revisions_internal_insert" on public.product_revisions;
create policy "product_revisions_internal_insert" on public.product_revisions for insert to authenticated with check (public.is_internal_member() and created_by=auth.uid());
drop policy if exists "product_revisions_delete_own_or_founder" on public.product_revisions;
create policy "product_revisions_delete_own_or_founder" on public.product_revisions for delete to authenticated using (public.can_delete_owned_or_founder(created_by));

comment on table public.product_lots is 'Permanent MainHub product chapters / Lotti grouping internal product dossiers.';
comment on table public.products is 'Moscatelli internal product dossiers spanning concept, sampling, approval, production and release.';
comment on table public.product_revisions is 'Dated sample and revision history belonging to a product dossier.';
comment on column public.products.supplier_name is 'Temporary supplier/mill reference; planned to migrate to the shared Suppliers module in Patch 21G.';

notify pgrst, 'reload schema';

do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='product_lots') then alter publication supabase_realtime add table public.product_lots; end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='products') then alter publication supabase_realtime add table public.products; end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='product_revisions') then alter publication supabase_realtime add table public.product_revisions; end if;
  end if;
end $$;
