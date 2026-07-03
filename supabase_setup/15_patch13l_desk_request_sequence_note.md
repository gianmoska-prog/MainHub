# Patch 13L — Desk Request Sequence Guard

Patch 13L is a frontend-only Desk synchronisation patch. It does not require SQL.

## Purpose

Patch 13K introduced authoritative Desk reloads through realtime, polling, focus, and visibility events. Those reloads can overlap. Patch 13L adds a monotonic Desk request sequence so that an older, slower reload cannot overwrite a newer reload's DOM state.

## Frontend changes

- Adds `DeskRuntime.requestSeq`.
- `loadDeskMessages()` now assigns each load a sequence number.
- If a load resolves after a newer load has already started, it is discarded before clearing or rebuilding the Desk DOM.
- The Supabase Desk list query now fetches the newest 300 rows first, then sorts them ascending in the browser for normal oldest-to-newest display.
- Build marker updated to `patch13l-desk-request-sequence`.

## SQL

No SQL migration is required.
