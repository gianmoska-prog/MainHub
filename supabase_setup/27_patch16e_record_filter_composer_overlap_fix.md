# Patch 16E — Record Filter / Composer Overlap Fix

Scope: narrow Dashboard / The Record interaction fix.

## Changes

- Prevented the Record Index filter menu from opening while the New Record composer is expanded.
- Added a `dashboard-shell.is-composing` state so the Index filter becomes visually subdued and non-interactive during entry composition.
- Ensured opening the composer closes any open Index menu.
- Kept the composer category menu inside the composer flow and refined its scroll behaviour.
- Styled composer/menu scrollbars so native bright scrollbars do not break the dark ledger aesthetic.

## Not changed

- No SQL changes.
- No RLS changes.
- No Storage policy changes.
- No Auth changes.
- No Gallery, Divisions, Home, or Desk database changes.
