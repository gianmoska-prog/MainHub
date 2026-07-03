# Patch 13M — Desk Non-Destructive Reconcile

Patch 13M is a frontend-only Desk stabilisation patch. It does not require SQL.

## Purpose

Patch 13L added request sequencing, but forced Desk reloads could still remove all rendered messages when a reload returned an empty, stale, or incomplete result. Patch 13M changes the Desk reload behaviour from destructive clear-and-rebuild to non-destructive reconciliation.

## Frontend changes

- Keeps the Patch 13L request sequence guard.
- Keeps the newest-300 Supabase fetch followed by browser-side ascending sort.
- Supabase Desk SELECT errors now throw, so a failed read cannot be treated as an empty Desk.
- `renderDeskMessageRecord()` can replace an existing message when authoritative data for the same id arrives.
- `loadDeskMessages()` no longer clears all `.desk-message` nodes during forced reloads. It replaces only the messages returned by Supabase, which preserves local/live messages during transient stale reads while still allowing soft-delete updates to replace a live bubble with a deleted notice.

## SQL

No SQL migration is required.
