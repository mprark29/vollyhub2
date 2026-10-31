# Friends of Pine Ridge — Volunteer Hub 2.0 (initial clean rebuild)

This is a **new modular frontend**. It is not a feature-complete replacement for the existing production app. The original ~1MB HTML is not used.

## Run locally

From this folder: `python -m http.server 8080`, then visit http://localhost:8080. The app imports the Supabase JS client from esm.sh, so an internet connection is needed. Deploy this entire folder (not only index.html) to a **new Vercel staging deployment** with framework preset "Other" and output directory `.`.

## Existing database

Uses the existing public publishable key and the existing Supabase project. No service-role key is embedded. Does not create or drop any database tables. Uses: `profiles`, `roles`, `user_roles`, `events`, `hazards`, `photos`, `shifts`, `admin_equipment`, `admin_field_crews`, `admin_crew_members`, `admin_announcements`, `admin_branding`, `admin_action_log` and RPC `admin_assign_role`.

## Important caveats

- Role resolution queries `user_roles` and `roles` using the signed-in user's session. **RLS must allow these reads**. A denied role lookup fails closed; do not bypass RLS to make the UI appear to work.
- The `admin_assign_role` function in the previously supplied SQL assumes UUID `roles.id` and `user_roles.role_id`. Verify your actual schema before testing role changes; if the function does not match, role changes will display an error.
- Event creation, gallery moderation, hazard evidence handling, public guest hazard submission, RSVP, attendance approvals/corrections, password recovery and upload flows are **not yet ported**. They require a verified schema and security workflow before production use.
- The frontend restricts navigation but **RLS and server-side functions** enforce security. Never put private evidence or medical information in public queries.
- Changes to the schema or RLS should be applied only after taking a database backup and reviewing SQL.
- This initial build has been statically checked, **not live tested** with your Supabase project. Keep the current production app unchanged.
