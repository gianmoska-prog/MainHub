# Patch 16G — Record Index Trigger Occlusion Fix

This patch is intentionally narrow and only addresses the remaining Dashboard/Record overlap issue after Patch 16F.

## Scope

- Hides/suppresses the `Open New Entry` trigger while the `Index` dropdown is open.
- Adds an `is-filtering` state to the Dashboard shell while the Index menu is active.
- Removes the entry trigger from keyboard focus while the Index menu is active.
- Preserves the existing mutual exclusion behaviour from Patch 16F:
  - opening the Index closes the composer;
  - opening the composer closes the Index;
  - opening the composer category closes the Index.

## Not changed

- No SQL changes.
- No RLS changes.
- No Storage policy changes.
- No Auth changes.
- No Home, Gallery, or Divisions changes.
- No attachment persistence changes.
- No Desk database changes.
