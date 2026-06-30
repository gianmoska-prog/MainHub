# MOSCATELLI — Frontend connection notes

This site build includes the first live Supabase Auth connection layer:

- `@supabase/supabase-js@2`
- browser-safe publishable key usage
- `signInWithPassword`
- session restoration
- `onAuthStateChange`
- profile lookup from `public.profiles`
- inactive profile handling
- real sign out
- GitHub Pages URL support

The Record and The Desk still use the local/mock data adapter for entries, messages, and attachments. That is intentional for this stage: the authentication gate is live first; persistent Record/Desk data should be connected in a later patch without redesigning the UI.

## Current live Auth flow

Expected browser-side flow:

```js
supabase.auth.getSession()
supabase.auth.signInWithPassword({ email, password })
supabase.auth.onAuthStateChange(...)
supabase.auth.signOut()
supabase.from('profiles').select(...)
```

## Later data-persistence patch

Keep the current `InternalData` interface and replace only the internal implementations of:

```js
InternalData.posts.list()
InternalData.posts.create()
InternalData.posts.remove()
InternalData.messages.list()
InternalData.messages.send()
InternalData.attachments.fromComposer()
```

Expected Supabase methods later:

```js
supabase.from('record_posts').select(...)
supabase.from('record_posts').insert(...)
supabase.from('record_posts').delete(...)
supabase.from('desk_messages').select(...)
supabase.from('desk_messages').insert(...)
supabase.storage.from('record-attachments').upload(...)
supabase.channel(...).on('postgres_changes', ...)
```

## GitHub Pages URLs

Keep both in Supabase Auth redirect allow-list for future recovery/confirmation flows:

```text
https://gianmoska-prog.github.io/MainHub/
https://gianmoska-prog.github.io/MainHub/index.html
```

Password login itself does not require a magic-link redirect callback.
