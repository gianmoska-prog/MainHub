# Patch 15G — Record Composer Readability

Scope: frontend-only readability polish for the floating Record composer.

## Changes

- Strengthened the Record composer glass panel with a darker translucent backing.
- Increased backdrop blur and reduced background bleed-through behind the composer.
- Improved input, textarea, category selector, button, process-note, and feedback text contrast.
- Added subtle text-shadow to improve legibility over the cinematic background.
- Kept the existing floating composer layout, Record attachment logic, authorship display, Supabase auth, RLS, storage policies, and database schema untouched.

## Build marker

`patch15g-record-composer-readability`

## Manual validation

After deployment, open Dashboard / The Record, create a new entry over existing posts, and confirm:

- the composer remains translucent but readable;
- title/body placeholder and typed text are clearly visible;
- category selector text is legible;
- the compression/upload process note is readable;
- the commit button remains visible without feeling SaaS-like;
- attachment posting still works.
