# MOSCATELLI — Supabase Setup Pack

Research date: 2026-06-29

This pack prepares the backend structure for the private Moscatelli internal environment.

It is designed for the current website architecture:

- The Record / Dashboard
- The Desk / internal correspondence
- private image attachments
- invite-only internal users
- persistent login until manual sign-out
- ownership rule: users can delete their own entries; founder can delete any entry

No Supabase account is required to inspect this pack. Once the project exists, use the files in this folder in order.

## Recommended execution order

1. Create the Supabase project.
2. Configure Auth using `04_auth_and_redirect_checklist.md`.
3. Run `01_schema.sql` in the Supabase SQL editor.
4. Run `02_rls_policies.sql`.
5. Run `03_storage.sql`.
6. Invite/create users in Supabase Auth.
7. Use `04_seed_profiles_template.sql` to activate and assign roles.
8. Use `07_validation_queries.sql` to confirm the project is ready.
9. Follow `05_frontend_connection_guide.md` to connect the website later.

## Important security principle

The browser should only receive the Supabase project URL and public anon key.

Never place the service role key in the website.
