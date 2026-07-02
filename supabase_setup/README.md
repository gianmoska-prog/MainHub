# MOSCATELLI Supabase Setup

## Current deployment order after Patch 13J

For an existing project that already has Auth users, run the numbered SQL files in this order:

1. `01_schema.sql`
2. `02_rls_policies.sql`
3. `03_storage.sql`
4. `09_patch10_persistence_support.sql`
5. `10_patch11_realtime_support.sql`
6. `11_patch12d_desk_soft_delete.sql`
7. `12_patch13i_desk_shared_visibility.sql`
8. `13_patch13j_security_deployment_hardening.sql`
9. `04_seed_profiles_template.sql` after the Auth users exist and you have copied their UUIDs.
10. `07_validation_queries.sql`

Important: do not rely on `all_in_one_setup.sql` alone for the current build. It is retained as a legacy convenience file and does not represent the complete Patch 13J deployment unless regenerated.

Patch notes:
- Patch 12D adds Desk soft-delete columns: `deleted_at`, `deleted_by`, `deleted_by_display`.
- Patch 13I makes The Desk reload from Supabase as the source of truth and resets shared Desk visibility.
- Patch 13J removes browser hard-delete permission from `desk_messages`; Desk deletion should remain a soft-delete update only.

---

## Legacy notes from previous README

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


## Patch 10 note

Patch 10 connects The Record and The Desk frontend adapters to Supabase persistence. Existing Patch 9 projects should already have the required tables and RLS. If image attachment upload/delete fails because of Storage path validation, run:

1. `09_patch10_persistence_support.sql`
2. `07_validation_queries.sql`

The expected Storage object path is `{created_by}/{post_id}/{filename}` inside the private `record-attachments` bucket.

## Patch 11 note

Patch 11 enables Supabase Realtime for The Record and The Desk. Existing Patch 10 projects should run:

1. `10_patch11_realtime_support.sql`
2. `07_validation_queries.sql`

This adds `record_posts`, `record_attachments`, and `desk_messages` to the `supabase_realtime` publication and sets replica identity to `full` so delete events can be reflected accurately in the browser.

Patch 12D adds WhatsApp-style Desk soft deletion. Run `11_patch12d_desk_soft_delete.sql` once before testing deleted-message placeholders.
