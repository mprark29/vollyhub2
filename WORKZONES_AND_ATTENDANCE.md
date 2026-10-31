# Work zones and attendance integration — staging

## Included
- All users can view active work-zone polygons from Supabase on the satellite map.
- Administrators can draw work zones and save them as drafts. No admin editing buttons are rendered for non-admins.
- Administrators activate/retire work zones using the secured Supabase RPC `set_park_work_zone_status` (see SQL below). No volunteer can activate a zone.
- Signed-in users can opt into GPS monitoring on the map; boundary transitions trigger **on-screen warnings only**. GPS accuracy is shown and coordinates are not uploaded.
- Signed-in volunteers can run a **one-time optional GPS check** before clock-in. It does not block clock-in and does not save coordinates or geofence events.
- No automatic clock-out, no background monitoring, no emergency response functionality.

## Deploy
1. In staging Supabase SQL Editor, run `supabase/park_work_zones.sql` (after the earlier `park_geofences.sql`).
2. Deploy the entire Vite project through GitHub/Vercel.
3. Sign in as admin, open Park Map, draw a work zone and save draft.
4. In the administrator work-zone approvals panel, activate the draft. Active zones appear to all map viewers; administrators can retire them.
5. Reload the public and volunteer map to confirm active zones appear.

The status-changing RPC requires an authenticated administrator and rejects direct SQL Editor calls without an end-user JWT.

## Security and privacy
Existing RLS must be checked with actual volunteer and admin sessions. A UI-hidden control is not security. No location history or GPS events are persisted in this release; adding them requires a documented retention period, consent, restricted read access, and server-validated writes.

## Testing
JavaScript syntax checked only. Full Vite build and live Supabase/GPS browser tests not verified. Test admin, volunteer, and public views, and sign-in/out navigation before production deployment.
