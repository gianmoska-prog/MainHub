# Patch 17A — Dashboard Adaptive Viewport Frame

Purpose: improve the Dashboard / The Record page across ultra-wide, standard desktop, laptop, tablet, and mobile viewport sizes without changing Record data, Supabase, SQL, RLS, Storage, Auth, or Desk tables.

Changes:

- Added adaptive Dashboard width variables instead of a fixed 1060px ceiling.
- Added ultra-wide and 21:9/32:9 viewport handling so the ledger frame uses space more naturally.
- Added short-height desktop handling to reduce excess vertical pressure.
- Added intermediate tablet/compact-desktop handling before the existing mobile breakpoint.
- Made post columns, date spine, gaps, text width, attachment width, and expanded composer height adapt to viewport size.
- Kept existing Record behaviour, attachment persistence, attachment viewer, authorship, and dropdown mutual exclusion intact.

Validation target: verify Dashboard at approximately 1366×768, 1440×900, 1920×1080, 2560×1080, 3440×1440, tablet width, and mobile width.
