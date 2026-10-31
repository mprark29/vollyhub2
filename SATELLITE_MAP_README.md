# Real satellite basemap update (staging only)

Replaces the unreliable fixed image/SVG opacity overlay with Leaflet and Esri tiled satellite imagery.

- Real tile-based zoom/pan
- Satellite and street map switch
- GPS location with permission
- Visible tile errors
- No SQL migration

The previous SVG map's five illustrated zone boundaries are NOT drawn here: the original SVG is not georeferenced and would be misleading over a real map. Obtain verified zone polygon coordinates before adding those overlays.

Vercel build: npm install; npm run build; output dist. Dependency: leaflet ^1.9.4.
Static JS syntax was checked. A complete dependency install/build was attempted but could not complete in this environment. Live imagery access is not verified. Keep production unchanged.
