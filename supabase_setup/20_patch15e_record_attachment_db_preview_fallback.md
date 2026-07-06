# Patch 15E — Record Attachment DB Preview Fallback

Focused fix for Record attachments that were still failing to persist after Patch 15D.

## Scope

- Frontend only.
- No SQL changes.
- No RLS changes.
- No Storage policy changes.
- No visual-section changes.
- No Desk changes.

## Changes

- Keeps the normal preferred flow: resize locally, upload to the private `record-attachments` Storage bucket, insert `record_attachments` metadata, hydrate with a signed URL.
- Adds defensive exception handling around Storage upload and metadata insert calls.
- Adds an internal database-backed preview fallback if Storage upload fails.
- The fallback stores the already-resized image preview in `record_attachments.preview_url` as a data-image preview, while preserving the standard owner/post path structure required by existing metadata validation.
- Attachment hydration now recognises stored data-image previews and does not try to request signed URLs for those fallback rows.
- Adds explicit local-blob-missing diagnostics so selected attachments can no longer fail without a stage.

## Reason

Patch 15C stopped silent disappearance. Patch 15D added retry diagnostics. The live test still showed that attachments were not being persisted. This patch makes the entry retain its selected image even when the Storage layer rejects the upload, without weakening RLS or exposing public URLs.

## Build marker

`patch15e-record-attachment-db-preview-fallback`
