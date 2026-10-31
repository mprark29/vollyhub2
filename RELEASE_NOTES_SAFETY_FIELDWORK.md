# Volunteer Hub 2.0 — Safety + Conservation Fieldwork (STAGING)

## What this release actually adds
- Signed-in **Safety Check-In**: record `safe` or `assistance_requested` welfare status; optional note and association to an active shift. Check-in records persist in Supabase. No coordinates stored.
- Staff **Safety Overview**: open shifts, >5-hour shift review flags, latest welfare check-in per user, unresolved assistance requests and a staff-only resolve RPC.
- Signed-in **Field Sightings**: log native wildlife, native flora, invasive weeds, restoration activities or other observations with species/activity, work zone/landmark, quantity and notes.
- Staff **Field Records**: review the latest 150 field records.
- Adds two tables with RLS and a staff-only resolution function; leaves existing tables and park map unchanged.

## Deployment order
1. Back up the Supabase project. Run `supabase/safety_fieldwork.sql` in the Supabase SQL Editor, ideally staging first. It requires the existing `public.is_staff()` and `public.is_admin()` functions.
2. Deploy the full project directory to Vercel using `npm install` and `npm run build` (output `dist`). Do NOT re-run the older park boundary/work-zone SQL unless needed.
3. Sign in as a volunteer and test **Safety Check-In** and **Field Sightings**; confirm staff-only pages are not visible.
4. Sign in as staff and test **Safety Overview** and **Field Records**; resolve a test assistance request.
5. In Supabase, independently test RLS: volunteers cannot read another person's welfare checks or field records, cannot resolve welfare requests; anonymous users cannot access either table.

## Critical limitations
- **Not an emergency system**: no automatic notifications, SMS, email, paging, dispatch, or ranger escalation. Assistance requests are only visible when staff open the Safety Overview page. In emergencies, call 000 and follow existing procedures.
- The >5-hour flag is calculated when staff open the page; it is not a background overdue-shift monitor.
- Work zone is text rather than a georeferenced observation point; no GPS coordinates are collected or stored.
- No photo evidence uploads, offline queue, wildlife identification validation, duplicate detection, species-sensitive location masking or conservation treatment history yet.
- This is not a complete migration of the original single-file application.
- JS syntax checks passed. Full Vite build, SQL execution, RLS behaviour and browser/device operation were **not** verified in this environment.

## Legacy-feature reconciliation (from original HTML)
- Original app contains an extended-shift safety check-in banner (>5h), an SOS beacon button, and active weed/litter bag counts. These are NOT fully restored here.
- Original app contains a biodiversity/invasive-species sightings form and map overlays. This release restores basic structured observation capture but not the old overlays/photos or all field metadata.
- Guest hazard evidence and full gallery moderation/storage remain separate restoration work.
- Events RSVP/roster, recognition/kudos, audit reporting, photo moderation, equipment, crews and announcements need end-to-end verification before production.
