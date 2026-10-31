# Supabase-backed geofencing (staging)

1. Run `supabase/park_geofences.sql` in the **existing** Supabase project SQL Editor. Review the source polygon first. The migration creates one new RLS-protected table and an admin-only activation RPC, and seeds the government-published simplified polygon only if no active boundary exists. It does not modify existing attendance or roles tables.
2. Deploy the entire project to Vercel staging. The map fetches the active boundary from Supabase, or uses the bundled official KMZ geometry as an offline fallback if the migration has not run or the database is unavailable.
3. Admins can draw/import a replacement and **Save draft to Supabase**. This does not activate it. Review the record, then run `select public.activate_park_geofence('<draft-uuid>'::uuid);` in the Supabase SQL Editor, or invoke the RPC as an authenticated admin. Activation retires the prior version in one transaction.
4. Reload the map to see the newly activated version. No device GPS data is stored.

**Important:** `public.is_admin()` must exist and correctly use Supabase Auth, as in the existing project. Test admin and anonymous RLS on staging. GPS is advisory only, not an attendance enforcement or lone-worker safety feature. The KMZ boundary is government-published but simplified, not surveyed. The initial SQL seed is deliberately a single active boundary; subsequent revisions are append-only records. No automatic clock-out, staff notifications or background tracking.
