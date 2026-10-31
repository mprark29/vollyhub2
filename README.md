# Volunteer Hub 2.0 — consolidated stability release (staging)

A complete Vite project for GitHub/Vercel. Replace the repository contents, preserving `src/`. Build: `npm install && npm run build`; output: `dist`. Do not deploy to production before end-to-end verification.

## Improvements over the previous coordinated update
- Exact database role-name matching (prevents accidental administrator classification from arbitrary role IDs or substring matches).
- Administrator-only field-crew mutation controls; staff retain read access.
- Database write/delete verification: zero updated rows is an error, not a success.
- Improved form handling after navigation/rerender.
- Existing workflows preserved: events, volunteer hazards, attendance, gallery submission/moderation, equipment, crews, announcements, roles, branding and audit.

## Not yet migrated / prerequisites
- Gallery bucket name `volunteer-gallery` and corresponding storage RLS **must be checked** against your existing Supabase project. Do not create a public bucket.
- Shift columns, events/hazards columns and RLS must match the existing schema.
- Guest hazard Edge Function, volunteer hazard evidence, approved public gallery, timesheet approvals and historical corrections are **not implemented in this build**.
- Database role names must be one of: admin, administrator, master admin, master_admin, manager, staff, coordinator, group coordinator. If yours differ, update the exact allowlist in `src/db.js` after checking your `roles` table.
- No new SQL is required by this release; no Supabase records are deleted or migrated.

## Smoke test
1. Login with admin, staff and volunteer accounts. Verify sidebar permissions.
2. Create an equipment item, refresh, and verify persistence. Test edits and deletes.
3. Test crew creation and assignment as admin; confirm staff cannot mutate.
4. Create an event, submit a hazard, clock in/out, and reload each.
5. Check gallery bucket configuration before testing uploads.
6. Test role assignments and audit records.
7. Check Vercel build logs and browser console for failures.
