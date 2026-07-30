-- MOSCATELLI Finance Division
-- Run after the existing profiles and internal-member policy helpers.

create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  category text not null check (
    category in (
      'Product Development',
      'Samples',
      'Packaging',
      'Photography/Video',
      'Legal',
      'Marketing',
      'Contingency',
      'Founder Contribution'
    )
  ),
  description text not null check (length(trim(description)) > 0),
  counterparty text not null default '',
  amount numeric(12,2) not null constraint finance_entries_amount_positive check (amount > 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'estimate' check (status in ('estimate', 'quoted', 'committed', 'paid')),
  entry_date date not null default current_date,
  notes text not null default ''
);

create index if not exists finance_entries_entry_date_idx on public.finance_entries (entry_date desc, created_at desc);
create index if not exists finance_entries_status_idx on public.finance_entries (status);
create index if not exists finance_entries_category_idx on public.finance_entries (category);
create index if not exists finance_entries_counterparty_idx on public.finance_entries (counterparty);
create index if not exists finance_entries_created_by_idx on public.finance_entries (created_by);

alter table public.finance_entries enable row level security;

grant select, insert, update, delete on table public.finance_entries to authenticated;
grant all on table public.finance_entries to service_role;

drop policy if exists "finance_entries_select_internal" on public.finance_entries;
create policy "finance_entries_select_internal"
on public.finance_entries
for select
to authenticated
using (public.is_internal_member());

drop policy if exists "finance_entries_insert_internal" on public.finance_entries;
create policy "finance_entries_insert_internal"
on public.finance_entries
for insert
to authenticated
with check (
  public.is_internal_member()
  and created_by = auth.uid()
);

drop policy if exists "finance_entries_update_own_or_founder" on public.finance_entries;
create policy "finance_entries_update_own_or_founder"
on public.finance_entries
for update
to authenticated
using (public.can_delete_owned_or_founder(created_by))
with check (public.can_delete_owned_or_founder(created_by));

drop policy if exists "finance_entries_delete_own_or_founder" on public.finance_entries;
create policy "finance_entries_delete_own_or_founder"
on public.finance_entries
for delete
to authenticated
using (public.can_delete_owned_or_founder(created_by));

comment on table public.finance_entries is
  'Lightweight MOSCATELLI Finance ledger for estimates, commitments, contributions, and paid expenses.';

notify pgrst, 'reload schema';
