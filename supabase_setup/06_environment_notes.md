# MOSCATELLI — Environment and operational notes

## Browser keys

Safe in browser:

- Supabase project URL
- Supabase public anon key

Never safe in browser:

- service role key
- database password
- SMTP credentials
- S3 access keys

## Data sensitivity level

Even if early entries are not highly sensitive, build the access model correctly now:

- Auth gates protect private routes.
- RLS protects data at database level.
- Storage bucket stays private.
- Users can delete their own entries.
- Founder can manage/delete all internal records.

## Future optional hardening

Later, consider:

- custom SMTP domain for auth emails
- rate limits review
- passkeys if Supabase project supports the chosen flow
- audit log table for deletion/edits
- separate channels for finance/operations if needed
- daily backup strategy if/when paid plan becomes justified
