# Map loading fix — staging

The map now renders the bundled government boundary immediately instead of awaiting the Supabase `park_geofences` query. The active boundary is fetched in the background with a 6.5-second timeout and graceful fallback. This addresses a possible stuck query when an admin session has stale authentication or network issues. It does not modify RLS or permissions.

**Additional diagnostic:** If the entire page still says `Loading…` before the map shell appears, the issue may be the `resolveAccess()` calls in `src/db.js`, which execute during sign-in, not the map boundary query. In that case, inspect browser Console and Network for hanging `/rest/v1/user_roles` or `/rest/v1/roles` calls. Do not loosen database policies to fix a loading spinner.

No SQL changes. Test in staging with admin, volunteer and public accounts.
