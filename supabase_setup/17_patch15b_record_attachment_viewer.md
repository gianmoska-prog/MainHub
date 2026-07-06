# Patch 15B — Record Attachment Viewer

Patch 15B adds a restrained attachment-inspection layer for The Record.

## Scope

- Adds a published Record attachment viewer / lightbox.
- Converts published Record attachment thumbnails into accessible buttons.
- Adds keyboard support for the viewer:
  - Escape closes the viewer.
  - Left / Right arrows move between plates in the same Record entry.
- Adds previous / next controls when a Record entry contains multiple plates.
- Adds post-level metadata in the viewer caption:
  - Record title
  - Record category
  - Record date
  - attachment size
- Adds lazy loading and async decoding for published post thumbnails.
- Adds signed URL refresh support for expired attachment previews.
- Adds a fallback placeholder for attachments whose preview URL cannot be created.
- Updates the frontend build marker to:

```text
patch15b-record-attachment-viewer
```

## Non-goals

This patch does not:

- Change Supabase SQL.
- Change RLS policies.
- Change the private storage bucket.
- Add captions to the database schema.
- Add chat, comments, reactions, or Desk behaviour.
- Perform the broader visual optimisation pass planned for patch 3 of 3.

## Notes

Supabase signed URLs remain valid for one hour. Patch 15B does not make the storage bucket public. Instead, it requests a fresh signed URL when a published preview or opened plate fails to load.
