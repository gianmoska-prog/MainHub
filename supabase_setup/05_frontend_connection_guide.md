# MOSCATELLI — Frontend connection notes

This site build includes the live Supabase Auth, persistence, and realtime connection layer:

- `@supabase/supabase-js@2`
- browser-safe publishable key usage
- `signInWithPassword`
- session restoration
- `onAuthStateChange`
- profile lookup from `public.profiles`
- inactive profile handling
- real sign out
- GitHub Pages URL support
- persistent Record data through `public.record_posts`
- persistent Desk data through `public.desk_messages`
- private Record attachment upload through the `record-attachments` bucket
- Supabase Realtime subscriptions for Record, Record attachments, and Desk messages

## Current live Auth flow

Expected browser-side flow:

```js
supabase.auth.getSession()
supabase.auth.signInWithPassword({ email, password })
supabase.auth.onAuthStateChange(...)
supabase.auth.signOut()
supabase.from('profiles').select(...)
```

## Current live data flow

The frontend now uses the existing `InternalData` interface against Supabase:

```js
InternalData.posts.list()
InternalData.posts.create()
InternalData.posts.remove()
InternalData.messages.list()
InternalData.messages.send()
InternalData.attachments.fromComposer()
```

Expected Supabase methods:

```js
supabase.from('record_posts').select(...)
supabase.from('record_posts').insert(...)
supabase.from('record_posts').delete(...)
supabase.from('record_attachments').select(...)
supabase.from('record_attachments').insert(...)
supabase.from('desk_messages').select(...)
supabase.from('desk_messages').insert(...)
supabase.storage.from('record-attachments').upload(...)
supabase.channel(...).on('postgres_changes', ...)
```

## Patch 11 realtime requirement

Run this once before testing live multi-user synchronization:

```text
10_patch11_realtime_support.sql
```

Then run:

```text
07_validation_queries.sql
```

## GitHub Pages URLs

Keep both in Supabase Auth redirect allow-list for future recovery/confirmation flows:

```text
https://gianmoska-prog.github.io/MainHub/
https://gianmoska-prog.github.io/MainHub/index.html
```

Password login itself does not require a magic-link redirect callback.
