# Mobile map work-zone labels
- Active work zones display persistent, high-contrast names directly over their polygons.
- Tapping a zone polygon shows its name and description.
- A touch-friendly work-zone list under the map lets users jump/zoom to any zone.
- Mobile map height adjusts to the viewport; toolbar controls and zoom controls have larger touch targets.
- All labels use escaped text; zone colours are limited to valid hex codes.
- Existing role restrictions, geofence boundary, GPS, Supabase, and attendance code retained.
- Labels are anchored at polygon bounds centres; on irregular concave polygons this may fall outside the zone. Consider a pole-of-inaccessibility algorithm for complex zones.
- Staging only: browser/device testing not performed.
