# Mobile zone marker update

- Replaces large map labels with fixed-size numbered circles that remain legible as the map zoom changes.
- Each number corresponds to a full-name, colour-coded, touch-friendly list below the map.
- Tap a circle or polygon for a popup showing the full zone name and description.
- Tap a list item to zoom to its polygon and open its popup.
- Existing role restrictions, attendance and Supabase work zones remain unchanged.
- No SQL migration required.

Note: Markers for overlapping or very close zones can overlap. The zone list always remains available to select any zone. Map marker placement uses polygon bounding-box centres; this may not lie within concave polygons. Browser/mobile testing remains required.
