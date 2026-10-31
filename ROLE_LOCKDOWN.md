# Geofence map permissions — staging fix

- Public: view map, boundary, map layers. No tracking or management controls.
- Signed-in volunteer/staff: same, plus My location and start/stop GPS monitoring. GPS stays in browser and is not saved.
- Administrator: additionally draw/finish/clear/restore boundaries, import/export GeoJSON and save draft to Supabase.
- The existing `park_geofences` SQL migration is still required for server-side write protection. Frontend hiding is not a security boundary; verify RLS rejects volunteer INSERT/UPDATE/DELETE and the activation RPC.
- No work-zone geographic polygons were supplied. The published park boundary is shown; zone overlays require verified work-zone GeoJSON and a separate access-controlled table.
- No database migration changes in this patch. Test public, volunteer, staff and admin accounts on staging.
