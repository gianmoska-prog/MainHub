-- MOSCATELLI Patch 26 — add Training as a Finance expense category.

alter table public.finance_entries
  drop constraint if exists finance_entries_category_check;

alter table public.finance_entries
  add constraint finance_entries_category_check
  check (
    category in (
      'Product Development',
      'Samples',
      'Packaging',
      'Photography/Video',
      'Legal',
      'Marketing',
      'Training',
      'Contingency',
      'Founder Contribution'
    )
  );

notify pgrst, 'reload schema';
