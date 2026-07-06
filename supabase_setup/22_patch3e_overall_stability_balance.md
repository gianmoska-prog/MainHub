# Patch 3E — Overall Stability & Balance

Patch 3E is the final visual/stability pass in the 3A–3E sequence. It begins from Patch 3D and avoids SQL, RLS, storage, Supabase Auth, and Desk database changes.

## Scope

- Balanced the global header/footer chrome across all routes.
- Added subtle top/bottom axis rules for a more consistent institutional frame.
- Added cross-section focus-visible treatment for keyboard access without changing the visual identity.
- Added a sixth side-nav stagger entry so Divisions participates in the menu entrance rhythm.
- Added an `is-nav-open` body state to stabilise pointer behaviour while the side navigation is open.
- Improved ultra-wide / short-height balance for Gallery, Divisions, and Dashboard.
- Improved small-screen footer reduction and side-nav touch spacing.
- Added mobile overscroll containment to Gallery, Divisions, and Dashboard routes.
- Tightened reduced-motion handling across the newer Gallery, Divisions, Dashboard, auth, and Record viewer elements.
- Closed the Record attachment viewer on browser hash/popstate route changes.

## Explicitly untouched

- No SQL changes.
- No RLS changes.
- No storage policy changes.
- No authentication changes.
- No Record schema changes.
- No Desk database changes.
- No new feature expansion.
