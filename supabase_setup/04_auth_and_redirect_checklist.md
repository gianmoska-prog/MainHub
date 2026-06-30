# MOSCATELLI — Auth and redirect checklist

Use this after creating the Supabase project.

## Auth strategy

Recommended: invite-only email authentication using magic link / OTP.

This keeps the internal area simple:

- no passwords to manage at first
- persistent browser session
- access remains until manual sign-out
- inactive users cannot access internal data even if they have an Auth account

## Supabase dashboard settings

1. Open Authentication.
2. Enable the Email provider.
3. Use passwordless email login / magic link or OTP.
4. Disable public self-signup if available in your project settings.
5. Create or invite users manually.
6. After users exist, activate them in `public.profiles` using `04_seed_profiles_template.sql`.

## Redirect URLs

Add your website URL to the allowed Redirect URLs.

Examples:

- local test: `http://localhost:3000`
- Netlify: `https://your-site.netlify.app`
- final domain: `https://moscatelliroma.com`

The website config already expects a future redirect like:

```js
redirectTo: `${window.location.origin}${window.location.pathname}`
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
