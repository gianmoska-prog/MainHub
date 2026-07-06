# Patch 15F — Record Authorship, Process Notice & Flicker Reduction

Scope: focused Record/dashboard behaviour only. No SQL, RLS, Storage, Auth, Gallery, Divisions, or Desk database changes.

## Changes

- Adds clearer composer process wording for plate handling:
  - plates are compressed locally in the browser;
  - they are then attached to the private Record;
  - the user should keep the window open until the entry appears.
- Adds pending composer feedback while entries are being recorded, with distinct wording for entries with attachments.
- Adds visible authorship to published Record entries using `profiles.display_name` when available.
- Falls back to the current logged-in profile for the user's own newly created entries.
- Reduces the Record flicker caused by realtime refreshes clearing and repainting the entire feed:
  - realtime refreshes are temporarily suppressed during the user's own post creation window;
  - Record reloads now reconcile posts in place instead of clearing the feed first.

## Preserved

- Patch 15A Record stabilisation.
- Patch 15B attachment viewer.
- Patch 15E attachment persistence fallback.
- Existing Supabase tables and policies.
- Existing private storage behaviour and RLS posture.
- Desk remains retired.

## Build marker

`patch15f-record-authorship-process-flicker-fix`
