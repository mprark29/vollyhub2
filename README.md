# Volunteer Hub 2.0 — coordinated staging update

This is a source-code release for GitHub/Vercel. Upload all project files including `src/workflows.js`. Vercel: Vite preset, `npm run build`, output `dist`. Do not replace production yet.

## Included workflows
- Staff event creation and basic edit/delete, backed by `events`.
- Volunteer hazard reporting to `hazards`, and staff hazard status updates.
- Volunteer clock-in/clock-out via `shifts`.
- Volunteer gallery upload and staff photo moderation.
- Existing volunteer directory, roles, field crews, equipment, branding, announcements, audit and read-only attendance history.

## Important integration prerequisites
These operations are based on known schema excerpts and **have not been tested against the live Supabase project**. They will show explicit errors if columns or policies differ. In particular:

- Volunteer hazard insert expects `hazards.reported_by_id` and an allowed status `open`. If your live schema differs, adapt `src/workflows.js` before testing.
- Gallery uploads expect a **private** Supabase Storage bucket named `volunteer-gallery`, appropriate authenticated upload and staff read policies, and `photos.uploaded_by_id`, `photos.storage_path` columns. The existing database may instead use another gallery bucket; do **not** create a public bucket or loosen policies to make this work. Update the bucket name after verifying the existing storage configuration.
- Shift clock-in expects `shifts.user_id`, `volunteer_name`, `activity`, `park_zone`, `start_time`, `status`, and an authenticated insert policy. Some deployments use a different user-id type or a server RPC. Do not bypass RLS.
- `admin_assign_role` and the admin tables are assumed to have been deployed already. Admin access depends on `user_roles` and `roles`.
- Guest hazard reporting, photo evidence for hazards, full timesheet approvals, public Gallery and complete guest/staff hazard unification are **not yet ported**. These must be completed before production cutover.

## Smoke-test checklist
1. Verify Vercel build and login as volunteer, staff, and admin.
2. Test event creation and reload; check it persists in Supabase.
3. Test hazard creation and staff status change.
4. Test clock in/out and attendance history.
5. Verify private gallery upload, staff moderation, and storage access; if bucket not found, stop and reconcile the bucket name/policies.
6. Test field crews, equipment, roles, branding, announcements and audit.
7. Verify a volunteer cannot access staff/admin operations by direct URL or database requests.

No SQL changes are bundled. This is a **staging candidate**, not a verified production release.
