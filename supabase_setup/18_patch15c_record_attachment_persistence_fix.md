# Patch 15C — Record attachment persistence fix

Scope: frontend only. No SQL, RLS, storage policy, Auth, or Desk database changes.

## Fix

This patch addresses a Record composer bug where an attached image could appear in the composer preview, but then disappear from the published Dashboard/Record entry after submission.

The issue was caused by a race between:

1. creating the `record_posts` row,
2. Supabase realtime refreshing the Dashboard before `record_attachments` metadata had finished persisting,
3. the renderer refusing to update an already-rendered post with the same id.

## Changes

- Defers Record realtime refresh while a post with selected attachments is still persisting.
- Forces the just-created post to replace any earlier realtime-rendered placeholder version.
- Adds rollback protection: if an entry was submitted with selected attachments but fewer attachments are persisted than expected, the newly-created post is removed and the composer stays open with a visible error.
- Adds an explicit visible error message for attachment-persistence failure.
- Keeps existing Supabase storage bucket, RLS, SQL schema, and signed URL flow unchanged.

## Build marker

`patch15c-record-attachment-persistence-fix`
