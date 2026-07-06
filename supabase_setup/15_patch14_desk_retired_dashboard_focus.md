# Patch 14 — Desk retired, Dashboard focus

This patch retires The Desk from the frontend.

## What changed

- The Desk trigger and panel are removed from the visible HTML.
- Desk permissions are disabled in the frontend role policy.
- Desk realtime subscription is disabled/no-op.
- Internal authenticated work should now focus on The Record/Dashboard.
- Team correspondence should be handled in external tools such as WhatsApp, Slack, Notion, Gmail, or another dedicated team app.

## Database note

No destructive SQL is included. Existing `desk_messages` rows are left untouched for historical safety. The website no longer exposes or uses The Desk UI.
