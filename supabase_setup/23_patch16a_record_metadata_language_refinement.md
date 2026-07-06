# Patch 16A — Record Metadata & Language Refinement

Frontend-only refinement patch for The Record / Dashboard.

## Scope

- Moves visible authorship into the upper metadata line of each Record entry.
- Leaves the delete action low and quiet in the entry footer.
- Replaces published attachment tile size labels with institutional plate labels:
  - Plate I
  - Plate II
  - Plate III
  - Plate IV
- Keeps composer-side attachment preparation information, but rewrites it in calmer, less technical language.
- Refines empty-state wording so the archive reads less like an app error/state.
- Preserves the Patch 15E/15F attachment persistence fallback and Patch 15G composer readability work.

## Not changed

- No SQL changes.
- No RLS changes.
- No Supabase Storage policy changes.
- No authentication changes.
- No Dashboard layout redesign.
- No composer trigger redesign.
- No Gallery, Divisions, or Home visual changes.
- No Desk database/table changes.

## Build marker

```text
patch16a-record-metadata-language-refinement
```

## Manual validation

After deployment:

1. Create a Record entry with one image.
2. Confirm the post shows the author near the top metadata line.
3. Confirm the published image tile reads `Plate I`, not a KB file-size label.
4. Open the image viewer and confirm the viewer still opens.
5. Create a post with multiple images and confirm labels progress as Plate I, Plate II, etc.
6. Confirm empty category wording appears correctly.
