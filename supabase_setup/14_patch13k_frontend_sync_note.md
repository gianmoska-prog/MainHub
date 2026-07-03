# Patch 13K — Desk authoritative sync fallback

No SQL migration is required for Patch 13K.

Purpose:
- The database now stores live messages for both Gianluca and Marcella correctly.
- The remaining failure pattern points to stale frontend/realtime/cache behaviour.
- Patch 13K makes The Desk periodically re-check Supabase while open.
- It also reloads from Supabase on window focus and visibility return.
- The reload is signature-aware, so identical data should not constantly re-render.

Manual verification:
1. Deploy the Patch 13K ZIP.
2. Hard refresh both browsers.
3. In DevTools console, run:
   `window.MoscatelliInternal.getBuild()`
   It should return:
   `patch13k-desk-authoritative-sync`
4. Log in as Gianluca and Marcella in separate browsers.
5. Open The Desk on both.
6. Send messages both directions.
