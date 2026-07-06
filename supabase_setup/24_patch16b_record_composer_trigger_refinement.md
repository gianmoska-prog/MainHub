# Patch 16B — Record Composer & Entry Trigger Refinement

This patch is a narrow visual/interaction refinement for The Record composer only.

## Scope

- Replaced the circular plus-style Record trigger with a quieter ledger-style text trigger.
- Added the `dashboard.openEntry` translation key for the trigger label.
- Moved the composer into the Record flow so opening a new entry displaces the ledger instead of floating over posts.
- Removed the fixed/mobile floating composer behaviour in favour of an inline ledger-page expansion.
- Preserved the Patch 15A–16A Record functionality, attachment persistence, authorship, and plate labelling.

## Non-goals

- No SQL changes.
- No RLS or Storage policy changes.
- No Supabase Auth changes.
- No Gallery, Divisions, Home, or Desk database changes.
- No new Record features.

## Build marker

`patch16b-record-composer-trigger-refinement`
