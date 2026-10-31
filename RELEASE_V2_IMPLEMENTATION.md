# Volunteer Hub 2.0 — Conservation and Safety release

## Included
- Existing clickable park boundary and work zones remain intact.
- Field observations can link to a published work zone, optionally store a GPS point, and upload one private photo. Signed-in users see GPS observation markers on the Park Map (own records for volunteers; all accessible records for staff).
- Private Supabase Storage bucket `conservation-photos` and record-to-photo mapping, with signed links valid five minutes.
- Weed treatment records with method, date, follow-up due date, outcome, optional GPS and zone link.
- Staff-only Safety Alerts dashboard, assistance-request trigger and overdue shift alert generation.
- Optional scheduled database job and email-delivery Edge Function, both requiring explicit setup.

## Install order (IMPORTANT)
1. Back up Supabase. Previous `safety_fieldwork.sql` migration must already have succeeded.
2. Run **only** `supabase/conservation_safety_v2.sql` in Supabase SQL Editor. Do not rerun older migrations unnecessarily.
3. Deploy the whole Vite project to your GitHub/Vercel staging branch. Check build and sign-in.
4. Test with separate volunteer and staff accounts: field record with GPS and photo; private photo access; weed treatment; assistance request; alert visibility; mark reviewed; park map.
5. To generate overdue alerts automatically, enable pg_cron in Supabase and run `supabase/OPTIONAL_OVERDUE_SCHEDULER.sql` **once**. Check the schedule exists; otherwise the alert scanner runs only when the optional Edge Function is invoked.
6. To deliver alerts by email, configure Supabase Edge Function `deliver-safety-alerts`, and set secrets: `RESEND_API_KEY`, `ALERT_FROM_EMAIL` (verified sender domain), `ALERT_TO_EMAIL` (authorised staff inbox), `ALERT_CRON_SECRET` (long random secret), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Configure an external scheduler to POST to the deployed function with `x-cron-secret` header every 5–15 minutes. **Never put the service-role key or cron secret in Vercel client environment variables.** If you enable Supabase JWT verification for the function, your scheduler must also provide a valid authorised bearer token; otherwise use the function's own `x-cron-secret` check and disable platform JWT verification for that function only.
7. Test email receipt, failure/retry, duplication, and escalation procedures. Do not consider the service operational until tests pass.

## Safety limitations
This is NOT a monitored emergency response or lone-worker system. In-app alerts are stored server-side but not actively monitored without staff processes. Emails are NOT sent unless the Edge Function and scheduler are deployed and configured. There is no SMS, push notification, acknowledgement deadline or guaranteed delivery. Call 000 for emergencies. The five-hour threshold is an operational example, not a safety standard. Precise wildlife coordinates are sensitive and access is limited by RLS; avoid publicly sharing map links or signed photo URLs.

## Privacy and data governance
GPS capture is optional, browser-permission based and stored in the database. Private photo URLs are short-lived; only signed-in authorised users can request them. Photos may include EXIF metadata; strip sensitive metadata before upload if necessary. Obtain consent and apply local data retention policies.

## Verification / limitations
JavaScript syntax was checked locally; Vite build could not be completed in this environment because dependency installation timed out; live Supabase schema, storage, RLS, email service and mobile browsers still require testing. Old source files are retained for migration history; this release does not claim feature parity with the legacy one-file hub.
