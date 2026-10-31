# Original-feature restoration audit — Volunteer Hub 2.0

Source: `volunteer_hub_staging_event_creation_restored.html` (original 1.1 MB app).
Baseline: Volunteer Hub 2.0 Attendance UI Overhaul.

## Implemented in this staging package
- A new **Park Map** page in the main navigation, visible to guests and signed-in users.
- Restored original SVG visual map with the five labelled work zones and illustrative park boundary.
- Interactive zone selection, zoom/reset, optional external satellite image layer, browser GPS coordinate display, and external Google Maps link.
- Forest-green responsive styling; existing attendance, events, hazards, Gallery, field crews and administration code retained.

## Not yet migrated / not represented as functional
- Original park-boundary polygon is an illustration, not a verified cadastral/geofence dataset.
- Map zone selection is UI-only and is not yet connected to shift start, events, or persisted GIS records.
- Geofence-triggered automatic clock-out and lone-worker alerts are deliberately not enabled: they need verified geometry, permissions, safety review, and backend enforcement.
- GPS coordinates are shown only after browser permission; no location is stored or shared.
- Biodiversity sightings, weed reports, detailed field observations, kudos, advanced news alerts, polygon editing and other legacy-only workflows still require table-by-table migration.
- Public Gallery and guest hazard reporting need their existing private storage and Edge Function workflows integrated, not replaced with generic writes.

## Validation
- All JS modules passed Node syntax checks.
- No live Supabase test, browser visual test, or Vite dependency build was performed.
- No SQL changes. Deploy to staging only.

## Next coordinated migration
1. Compare original feature DOM/events with current pages and Supabase schema.
2. Reuse existing hazards/photos/events/shifts data; preserve RLS and private evidence.
3. Define verified GIS geometry and storage for field sightings and work zones.
4. Integrate original guest hazard Edge Function, gallery moderation and field safety workflows.
5. Test all user roles and persistence in staging before production.
