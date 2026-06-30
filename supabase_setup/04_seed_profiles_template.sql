-- MOSCATELLI — Profile activation template
-- Run after creating/inviting users in Supabase Auth.
-- Replace the UUIDs and emails below with the real auth.users IDs.

-- Founder
insert into public.profiles (id, email, display_name, role, division, is_active)
values (
  '00000000-0000-0000-0000-000000000000',
  'gianluca@example.com',
  'Gianluca',
  'founder',
  'all',
  true
)
on conflict (id) do update set
  email = excluded.email,
  display_name = excluded.display_name,
  role = excluded.role,
  division = excluded.division,
  is_active = excluded.is_active,
  updated_at = now();

-- Partner example: Gabriela
insert into public.profiles (id, email, display_name, role, division, is_active)
values (
  '00000000-0000-0000-0000-000000000001',
  'gabriela@example.com',
  'Gabriela',
  'partner',
  'marketing',
  true
)
on conflict (id) do update set
  email = excluded.email,
  display_name = excluded.display_name,
  role = excluded.role,
  division = excluded.division,
  is_active = excluded.is_active,
  updated_at = now();

-- Partner example: Marcella
insert into public.profiles (id, email, display_name, role, division, is_active)
values (
  '00000000-0000-0000-0000-000000000002',
  'marcella@example.com',
  'Marcella',
  'partner',
  'operations',
  true
)
on conflict (id) do update set
  email = excluded.email,
  display_name = excluded.display_name,
  role = excluded.role,
  division = excluded.division,
  is_active = excluded.is_active,
  updated_at = now();
