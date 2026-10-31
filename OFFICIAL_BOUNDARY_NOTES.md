# Government-published Pine Ridge Conservation Park boundary

Source: uploaded `conservation-park-pine-ridge.kmz` (KML placemark `conservation-park-pine-ridge`), whose embedded links identify Queensland Government WetlandInfo.

The KML explicitly states: “all boundaries have been simplified to within a tolerance of 0.00001 degrees.”

This build replaces the draft preloaded boundary with the 24-point closed government-published polygon (23 distinct vertices), and provides **Restore official boundary** after drawing or importing a draft. It also includes `public/pine-ridge-official-boundary.geojson`.

**Not a cadastral survey:** published/simplified mapping does not establish an exact legal boundary. Browser GPS accuracy, device permissions, and boundary-edge uncertainty must be accounted for. Monitoring remains advisory, does not write location data, does not auto-clock-out, and does not send emergency alerts.

The map is not a substitute for QPWS instructions or a lone-worker safety system.

Staging only. No SQL migration. Static syntax checks passed; no live browser/GPS validation.
