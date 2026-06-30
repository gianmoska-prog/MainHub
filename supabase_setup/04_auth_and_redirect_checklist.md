# MOSCATELLI — Auth and redirect checklist

Use this after creating the Supabase project.

## Auth strategy

Recommended for the current build: invite-only email and password authentication.

This keeps the internal area closed while avoiding magic-link redirect fragility on GitHub Pages:

- users are created manually in Supabase Auth
- each approved user has a password
- persistent browser session remains available
- inactive profiles cannot access internal data even if they have an Auth account
- public self-signup should remain disabled where available

## Supabase dashboard settings

1. Open Authentication.
2. Enable the Email provider.
3. Ensure email/password sign-in is available.
4. Disable public self-signup if available in your project settings.
5. Create users manually and set passwords for them.
6. After users exist, activate them in `public.profiles` using `04_seed_profiles_template.sql`.

## Redirect URLs

Password login does not depend on a magic-link callback. Still, keep redirect URLs configured for future recovery or confirmation flows.

Add both in Supabase Auth redirect allow-list:

```text
https://gianmoska-prog.github.io/MainHub/
https://gianmoska-prog.github.io/MainHub/index.html
```

Set the Site URL to:

```text
https://gianmoska-prog.github.io/MainHub/
```

## Session persistence

The website is prepared for:

```js
persistSession: true
autoRefreshToken: true
detectSessionInUrl: true
```

This means the session should persist in the browser until the person signs out, unless Supabase project/session settings later impose stricter limits.

## Do not expose

Never expose:

- Supabase service role key
- database password
- SMTP credentials
- S3 access keys

Only the project URL and anon/public key belong in the browser.
