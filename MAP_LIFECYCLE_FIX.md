# Park Map lifecycle crash fix

Root cause identified in code: `stopWatch()` used `document.getElementById('map-watch').textContent` without checking that the button still exists. When signing in or changing page, `shell()` removes the previous map's DOM, and the next `renderParkMap()` calls the previous `stopWatch()`. On a signed-in account this causes `Cannot set properties of null (setting 'textContent')`. The prior `init()` also caught render errors as authentication errors, resetting the user to public view and leaving `Loading…`.

Fixes:
- Cleanup tolerates the previous map's removed DOM.
- Old map removal is guarded.
- Async geofence results won't update disconnected status elements.
- `init()` separates authentication error handling from page rendering errors.

No SQL changes. Test sign-in, sign-out, navigation Park Map → Dashboard → Park Map, volunteer and admin sessions. Syntax checks pass; browser testing not performed.
