# Patch 16D — Record Empty Entry / Dropdown Collision Bugfix

Scope: focused Dashboard / The Record bugfix only.

Changes:
- Prevents structurally empty or legacy placeholder Record rows from rendering as unexplained black bars with only Delete visible.
- Removes any already-rendered empty placeholder row from the feed during refresh rather than displaying it.
- Preserves non-empty title-only, body-only, and attachment-bearing entries.
- Stops the Index filter dropdown and the New Entry category dropdown from being open at the same time.
- Changes the New Entry category menu to open downward inside the composer, so it no longer collides with the page-level Index menu.

No SQL, RLS, Storage, Auth, Desk database, Gallery, Divisions, or Home changes.
