# MOSCATELLI MainHub — Slack installation

The integration uses a dedicated Slack app and one Supabase Edge Function. Bot tokens, the Slack signing secret, and the MainHub shared secret belong only in Supabase secrets/Vault; they must never be added to this repository or to browser code.

## Slack app

1. In Slack API, create an app **from an app manifest** and select the MOSCATELLI workspace.
2. Paste `slack-app-manifest.yml`, review the requested permissions, and create the app.
3. Install the app to the workspace.
4. Invite **MOSCATELLI MainHub** to `#updates`, `#mainhub-activity`, `#decisions`, `#operations`, `#finance`, and `#mainhub-testing`.
5. Keep the Bot User OAuth Token and Signing Secret available only long enough to place them in Supabase Edge Function secrets.

## Supabase secrets

Set these Edge Function secrets:

- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET`
- `MAINHUB_SLACK_SHARED_SECRET`

The first two come from the Slack app. Generate the third as a long random value. Store the same shared value in Supabase Vault under `mainhub_slack_shared_secret`; also store the project URL in Vault under `mainhub_project_url`.

## Database and function

1. Apply `supabase_setup/44_patch22_slack_integration.sql`.
2. Deploy `supabase/functions/mainhub-slack` with JWT verification disabled, as declared in `supabase/config.toml`.
3. Populate `public.slack_channel_routes.channel_id` from the live Slack workspace. Do not commit private channel IDs.
4. Set `public.slack_integration_settings.environment` to `testing`, then set `enabled` to `true`.
5. Send a founder test from MainHub and verify delivery in `#mainhub-testing`.
6. Verify `/mainhub record`, `/mainhub calendar`, a notification action, and an attachment upload.
7. Change the integration environment to `production` only after all tests pass.

## Delivery policy

- Decisions, finance, project completion/reopening, and deletions are immediate.
- Routine updates are collected into the daily `#updates` digest.
- Finance always routes to the private `#finance` channel with complete entry detail.
- In testing mode, every outbound notification routes to private `#mainhub-testing`.
- Slack actions are accepted only from a Slack identity linked to an active MainHub profile.
