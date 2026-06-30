# MOSCATELLI — Supabase Setup Pack

Research date: 2026-06-29  
Updated after external audit intake: 2026-06-30

This pack prepares the backend structure for the private Moscatelli internal environment.

It is designed for the current website architecture:

- The Record / Dashboard
- The Desk / internal correspondence
- private image attachments
- invite-only internal users
- persistent login until manual sign-out
- ownership rule: users can delete their own entries; founder can delete any entry
- active-profile rule: inactive users cannot mutate private records
- historical integrity rule: deactivate users rather than deleting them

## Recommended execution order for a fresh Supabase project

1. Create the Supabase project.
2. Configure Auth using `04_auth_and_redirect_checklist.md`.
3. Run `01_schema.sql` in the Supabase SQL editor.
4. Run `02_rls_policies.sql`.
5. Run `03_storage.sql`.
6. Invite/create users in Supabase Auth.
7. Use `04_seed_profiles_template.sql` to activate and assign roles.
8. Use `07_validation_queries.sql` to confirm the project is ready.

## If you already ran the earlier setup files

Run:

```text
08_hardening_migration.sql
```

Then run:

```text
07_validation_queries.sql
```

## Important security principle

The browser should only receive the Supabase project URL and public publishable/anon key.

Never place the service-role key, secret key, database password, or private JWT secret in the website.
