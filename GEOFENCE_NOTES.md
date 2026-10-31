# Advisory geofence prototype — staging only

- Draw a draft park boundary by clicking points on the map, then finish and export GeoJSON.
- Import an existing GeoJSON Polygon for review. Imported polygons are **not automatically trusted**.
- Start/stop browser GPS monitoring; a local point-in-polygon check shows estimated inside/outside status.
- No GPS data or boundaries are saved to Supabase, and no automatic clock-out, emergency notification or staff tracking is performed.
- GPS accuracy and uncertainty near polygon boundaries are not fully modelled; this must not be used for safety decisions.
- A verified, land-manager-approved park boundary and user consent/privacy policy are required before operational geofencing.
- No SQL migration required. All modules have been syntax checked; browser and live GPS tests remain outstanding.
