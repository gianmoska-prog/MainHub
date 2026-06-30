# MOSCATELLI — Frontend connection notes

This site build already includes the first live Supabase Auth connection layer:

- `@supabase/supabase-js@2`
- browser-safe publishable key usage
- `signInWithOtp`
- session restoration
- `onAuthStateChange`
- profile lookup from `public.profiles`
- inactive profile handling
- real sign out
- GitHub Pages redirect URL support

The Record and The Desk still use the local/mock data adapter for entries, messages, and attachments. That is intentional for this stage: the authentication gate is live first; persistent Record/Desk data should be connected in a later patch without redesigning the UI.

## Current live Auth flow

Expected browser-side flow:

```js
supabase.auth.getSession()
supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })
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

## GitHub Pages redirect URLs

Add both in Supabase Auth redirect allow-list:

```text
https://gianmoska-prog.github.io/MainHub/
https://gianmoska-prog.github.io/MainHub/index.html
```

The frontend also stores the pending internal route before sending the email link, then restores it after Supabase completes the login callback.
