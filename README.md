# Volunteer Hub 2.0 — coordinated attendance review update (staging)

Built on the previous stability release. All existing modules are retained.

## Added
- Staff attendance approvals and rejections backed by the existing `shifts` table, using `approved_hours`, `verified_by`, and `status`.
- Prevents reviewing shifts that have not ended and rejects invalid approval hours.
- Uses conditional database updates to prevent overwriting an already reviewed shift.
- Complete recent attendance history (up to 300 rows) including approved hours.
- Role assignment UI reloads after a successful database response.

## Requirements / limitations
- This reuses the existing Phase 7 shift approval schema and RLS guard. It requires staff update permission and the existing guard trigger. **Do not loosen RLS** if approval fails.
- This has not been live-tested against the user's Supabase database.
- Historical attendance corrections, guest hazards, photo storage reconciliation and public gallery are still outstanding.
- No SQL changes included. Keep production unchanged; deploy to staging and test with staff and volunteer accounts.

## Deploy
Upload the entire project to GitHub, preserving the src folder. Vercel preset Vite, build `npm run build`, output `dist`.
