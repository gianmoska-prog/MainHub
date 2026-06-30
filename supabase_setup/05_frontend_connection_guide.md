# MOSCATELLI — Future frontend connection guide

The current site is still in mock mode.

When the Supabase project exists, the future connection patch should do four things.

## 1. Add the Supabase client script

Recommended browser module approach:

```html
<script type="module">
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
</script>
```

Or bundle it later if the site moves into a build system.

## 2. Fill the config

Current placeholder:

```js
const INTERNAL_CONFIG = Object.freeze({
  mode: 'mock',
  supabaseEnabled: false,
  supabase: Object.freeze({
    url: '',
    anonKey: '',
    redirectTo: `${window.location.origin}${window.location.pathname}`
  })
});
```

Future live version:

```js
const INTERNAL_CONFIG = Object.freeze({
  mode: 'supabase',
  supabaseEnabled: true,
  supabase: Object.freeze({
    url: 'https://YOUR_PROJECT_ID.supabase.co',
    anonKey: 'YOUR_PUBLIC_ANON_KEY',
    redirectTo: `${window.location.origin}${window.location.pathname}`
  })
});
```

## 3. Replace adapter internals, not UI code

Keep the current `InternalData` shape.

Replace only the inside of:

```js
InternalData.auth.getSession()
InternalData.auth.signInMock()
InternalData.auth.signOut()
InternalData.posts.list()
InternalData.posts.create()
InternalData.posts.remove()
InternalData.messages.list()
InternalData.messages.send()
InternalData.attachments.fromComposer()
```

The Record and The Desk should not need a visual redesign.

## 4. Expected Supabase methods later

Typical future methods:

```js
supabase.auth.getSession()
supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })
supabase.auth.signOut()
supabase.from('record_posts').select(...)
supabase.from('record_posts').insert(...)
supabase.from('record_posts').delete(...)
supabase.from('desk_messages').select(...)
supabase.from('desk_messages').insert(...)
supabase.storage.from('record-attachments').upload(...)
supabase.channel(...).on('postgres_changes', ...)
```

## 5. Path convention for attachments

Use:

```text
{auth.uid()}/{post_id}/{filename}
```

That matches the Storage policies in `03_storage.sql`.
