# Patch 16C — Ledger Structure & Archive Presence

Frontend-only refinement from Patch 16B.

Scope:
- Strengthened Record post-to-post separation without converting entries into SaaS cards.
- Added a faint ledger spine / date-column guide for desktop layouts.
- Added more formal post interior rhythm, including a subtle main-entry rule.
- Refined the Index/filter trigger and menu treatment.
- Improved long-entry readability with wider line-height and preserved line breaks.
- Improved attachment plate framing and hover/focus presence.
- Added a quieter framed empty-state treatment.
- Added a small Decision-category emphasis through frontend CSS only.

Untouched:
- Supabase Auth
- RLS policies
- Storage policies
- SQL schema
- Record data functions
- Attachment persistence logic
- Attachment viewer logic
- Home, Gallery, Divisions
- Desk database tables

Validation required after deployment:
- Open Dashboard / The Record on desktop and mobile.
- Confirm old and new entries still render.
- Confirm filters still work.
- Confirm attachment thumbnails still open the viewer.
- Confirm long notes remain readable.
- Confirm no Gallery/Divisions/Home visual changes were introduced.
