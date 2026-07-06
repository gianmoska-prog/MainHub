# Patch 16F — Record Dropdown Mutual Exclusion

This frontend-only patch tightens the Dashboard / Record dropdown behaviour after Patch 16E proved insufficient in-browser.

## Scope

- Opening the Record **Index** filter now closes the open New Record composer first.
- Opening the New Record composer now forcibly closes and hides the Index dropdown.
- Opening the composer category menu now forcibly closes and hides the Index dropdown.
- Added a CSS failsafe so the Index dropdown cannot remain visible while the Dashboard is in composer mode.
- Added a body-level composer state for stronger visual/interaction fallback.

## Unchanged

- No SQL changes.
- No RLS changes.
- No Storage policy changes.
- No Auth changes.
- No Home / Gallery / Divisions changes.
- No attachment persistence changes.
- No Desk database changes.
