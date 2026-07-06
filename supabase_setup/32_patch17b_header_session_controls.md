# Patch 17B — Header Session Controls

Scope: move authenticated session information and sign-out control from the footer into the top-right header, with a more refined internal-access treatment.

Changes:

- Moved the session status / sign-out control from the footer to the header.
- Reformatted the control as a restrained glass plaque with separate status, user name, divider, and sign-out action.
- Kept the control compact on narrower screens.
- Preserved division-page return behaviour by shifting the return action away from the session plaque on wide signed-in views.
- Left Dashboard logic, Record attachments, Supabase, SQL, RLS, Storage policies, Auth flow, and Desk tables untouched.

Build marker:

`patch17b-header-session-controls`
