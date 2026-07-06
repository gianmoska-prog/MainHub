# Patch 15D — Record Attachment Retry & Diagnostics

Scope: focused attachment persistence repair only.

Changes:

- Keeps the Patch 15C protection that prevents entries from being silently saved without selected plates.
- Adds a short post-creation settling delay before attachment upload.
- Retries Supabase Storage upload and `record_attachments` metadata insertion before giving up.
- Emits clearer attachment retry/error events.
- Shows the failing attachment stage in the composer if persistence still fails:
  - `storage` means Supabase Storage bucket/policy/upload rejected the object.
  - `metadata` means the object uploaded but the `record_attachments` row could not be inserted.

No SQL, RLS, Storage policies, Auth, or Desk database tables are changed by this patch.

Build marker:

`patch15d-record-attachment-retry-diagnostics`
