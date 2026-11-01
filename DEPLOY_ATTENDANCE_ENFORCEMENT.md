# Volunteer Hub 2.0 — Attendance Enforcement Patch

Baseline: VolunteerHub2_Debug_Baseline_SQL_Syntax_Fixed.zip.

## Apply in this order
1. Back up the `shifts` table and existing Supabase policies/functions before production changes.
2. Confirm `start_geofenced_shift` and `report_shift_location` are installed (they were present in the user's SQL audit).
3. In Supabase SQL Editor, run **only** `supabase/FINAL_ATTENDANCE_ENFORCEMENT.sql`. It is transaction-wrapped, does not delete attendance records, and protects direct UPDATEs while removing direct INSERT permission.
4. Run the read-only verification below. `direct_insert_allowed` should be `false`, `clock_in_rpc_allowed` should be `true`.
5. Deploy source ZIP contents to GitHub repository root and redeploy Vercel. This patch does not change JavaScript: the baseline already calls the geofence RPC for clock-in and directly updates end_time/hours for clock-out. Staff reviews retain direct UPDATE.
6. Using TEST volunteer/staff accounts, verify clock-in inside, clock-in rejected outside, manual clock-out, staff approval, and automatic departure clock-out. Check the actual Supabase shifts/location/alert records. Do not run tests against real volunteer shifts.

```sql
SELECT
 has_table_privilege('authenticated','public.shifts','INSERT') AS direct_insert_allowed,
 has_function_privilege('authenticated', 'public.start_geofenced_shift(text,text,double precision,double precision,double precision)', 'EXECUTE') AS clock_in_rpc_allowed,
 (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.volunteer_shift_locations'::regclass) AS gps_rls_enabled;
```

## Important limitations
- SQL migration was NOT executed against live Supabase and has not undergone live integration testing. If existing attendance UPDATE triggers reject actions, stop and inspect them rather than disabling them.
- GPS positions are supplied by the browser, not attested hardware. Geofence is a workflow control, not proof of physical presence.
- Browser location monitoring stops or becomes unreliable when browser/app is suspended. Missing GPS and overdue alert schedules/email delivery require their own configuration and testing.
- This patch restricts ordinary volunteer shift UPDATE changes using a BEFORE UPDATE trigger. Staff's authorised updates remain subject to current RLS and approval triggers.
- This package retains existing `supabase/` migrations for reference. Do not re-run prior migrations unnecessarily.
