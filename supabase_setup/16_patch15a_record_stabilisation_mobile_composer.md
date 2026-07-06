# Patch 15A — Record Stabilisation / Mobile Composer

This patch is a frontend-only operational stabilisation patch built on Patch 14.

## Scope

- Restores Record creation on mobile viewports below 640px.
- Disables the Record commit button while a post is being created.
- Adds a client-side in-flight guard against duplicate submissions.
- Blocks fully empty Record entries before Supabase insertion.
- Adds visible composer feedback for validation, post errors, invalid attachment files, attachment-limit events, resize failures, and partial attachment upload failures.
- Uses the configured attachment limit instead of hardcoded `4` in composer logic.
- Sorts Record posts by full `created_at` timestamp rather than date-only grouping.
- Removes the most active retired-Desk runtime hooks from internal view loading and window focus/visibility refresh.

## Not included

- No SQL changes.
- No RLS changes.
- No storage policy changes.
- No Desk database/table removal.
- No attachment lightbox.
- No visual redesign.

## Expected build marker

`window.MoscatelliInternal.getBuild()` should return:

`patch15a-record-stabilisation-mobile-composer`
