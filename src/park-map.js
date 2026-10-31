import L from 'leaflet';

// Approximate map centre only. No surveyed park boundary is asserted.
const CENTER=[-27.900035,153.392267];
let activeMap=null;
let stopLocationWatch=null;
export function renderParkMap({box,notice}){
 if(stopLocationWatch){stopLocationWatch();stopLocationWatch=null;}
 if(activeMap){activeMap.remove();activeMap=null;}
 box(`<article class="card park-map-card"><div class="section-heading"><div><h2>Pine Ridge Conservation Park — interactive map</h2><p class="muted">Real satellite basemap. Park work-zone boundaries are not yet georeferenced; use this for orientation, not navigation or safety geofencing.</p></div></div><div class="map-toolbar"><button class="btn secondary" id="map-satellite">Satellite</button><button class="btn secondary" id="map-streets">Street map</button><button class="btn secondary" id="map-center">Return to park</button><button class="btn secondary" id="map-gps">My location</button><button class="btn secondary" id="map-draw">Draw boundary</button><button class="btn secondary" id="map-finish">Finish boundary</button><button class="btn secondary" id="map-clear">Clear boundary</button><button class="btn secondary" id="map-export">Export GeoJSON</button><label class="btn secondary" for="map-import">Import GeoJSON</label><input id="map-import" type="file" accept=".json,.geojson,application/json" hidden><button class="btn secondary" id="map-watch">Start GPS monitoring</button><a class="btn secondary" href="https://www.google.com/maps?q=-27.900035,153.392267" target="_blank" rel="noopener noreferrer">Open Google Maps</a></div><div id="park-leaflet-map" role="region" aria-label="Interactive satellite map of the Pine Ridge area" style="height:540px;min-height:380px;border-radius:12px;background:#1c3d2e"></div><p class="muted" id="map-status" aria-live="polite">Satellite imagery loads from Esri World Imagery. Zoom and pan with the map.</p><p id="geofence-status" class="muted" aria-live="polite">No verified boundary loaded. Draw a draft polygon or import a verified GeoJSON Polygon. GPS monitoring is advisory only; no automated clock-out, alerts to staff or location storage.</p><p class="muted">A drawn boundary is a draft, not a verified park boundary. GPS may be inaccurate or unavailable. This is not a lone-worker safety system.</p></article>`);
 const status=document.getElementById('map-status');
 const fenceStatus=document.getElementById('geofence-status');
 const map=L.map('park-leaflet-map',{zoomControl:true}).setView(CENTER,15);
 activeMap=map;
 const satellite=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles © Esri and contributors'});
 const streets=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'});
 let layer=satellite.addTo(map);
 let loaded=0,failed=0;
 const track=(next,name)=>{
  next.on('tileload',()=>{loaded++;if(loaded===1)status.textContent=`${name} imagery loaded. You can zoom and pan.`;});
  next.on('tileerror',()=>{failed++;status.textContent=`${name} tile request failed (${failed}). Check network access or browser content blocking.`;});
 };
 track(satellite,'Satellite');track(streets,'Street map');
 const switchTo=(next,name)=>{if(layer===next)return;map.removeLayer(layer);layer=next;loaded=0;failed=0;status.textContent=`Loading ${name}…`;next.addTo(map);};
 document.getElementById('map-satellite').onclick=()=>switchTo(satellite,'Satellite');
 document.getElementById('map-streets').onclick=()=>switchTo(streets,'Street map');
 document.getElementById('map-center').onclick=()=>map.setView(CENTER,15);
 let marker=null;
 let polygon=null,vertices=[],drawing=false,verified=false,watchId=null,watchCleanup=null;
 const pointInside=(lat,lng,pts)=>{let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [yi,xi]=pts[i], [yj,xj]=pts[j];if(((xi>lng)!==(xj>lng))&&(lat<(yj-yi)*(lng-xi)/(xj-xi)+yi))inside=!inside;}return inside;};
 const renderPolygon=()=>{if(polygon)map.removeLayer(polygon);polygon=vertices.length>=2?L.polygon(vertices,{color:verified?'#146f49':'#f59e0b',fillOpacity:.13,dashArray:verified?null:'7 5'}).addTo(map):null;};
 const stopWatch=()=>{if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null;}document.getElementById('map-watch').textContent='Start GPS monitoring';};
 stopLocationWatch=stopWatch;
 document.getElementById('map-draw').onclick=()=>{stopWatch();drawing=true;verified=false;vertices=[];renderPolygon();fenceStatus.textContent='Draft mode: click the map to place boundary vertices. Add at least three points, then select Finish boundary.';};
 map.on('click',e=>{if(!drawing)return;vertices.push([e.latlng.lat,e.latlng.lng]);renderPolygon();fenceStatus.textContent=`Draft vertices: ${vertices.length}. Select Finish boundary when complete.`;});
 document.getElementById('map-finish').onclick=()=>{if(vertices.length<3){fenceStatus.textContent='At least three vertices are required.';return;}drawing=false;renderPolygon();fenceStatus.textContent='Draft boundary complete. Export it for verification before operational use.';};
 document.getElementById('map-clear').onclick=()=>{stopWatch();drawing=false;vertices=[];verified=false;renderPolygon();fenceStatus.textContent='Boundary cleared. No geofence is active.';};
 document.getElementById('map-export').onclick=()=>{if(vertices.length<3){fenceStatus.textContent='Draw or import a polygon before exporting.';return;}const ring=vertices.map(([lat,lng])=>[lng,lat]);ring.push([...ring[0]]);const data={type:'FeatureCollection',features:[{type:'Feature',properties:{name:'Pine Ridge boundary',status:verified?'imported-unverified':'draft-unverified'},geometry:{type:'Polygon',coordinates:[ring]}}]};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/geo+json'}));const a=document.createElement('a');a.href=url;a.download='pine-ridge-boundary-draft.geojson';a.click();URL.revokeObjectURL(url);fenceStatus.textContent='Boundary exported. Confirm its accuracy with the land manager before relying on it.';};
 document.getElementById('map-import').onchange=async e=>{try{const f=e.target.files?.[0];if(!f)return;if(f.size>1024*1024)throw Error('File exceeds 1 MB');const geo=JSON.parse(await f.text());const geom=geo.type==='FeatureCollection'?geo.features?.[0]?.geometry:geo.type==='Feature'?geo.geometry:geo;if(geom?.type!=='Polygon'||!Array.isArray(geom.coordinates?.[0]))throw Error('Import a GeoJSON Polygon (single outer ring)');const ring=geom.coordinates[0];if(ring.length<4||ring.length>10000)throw Error('Polygon must have 3–9999 vertices');const points=ring.map(p=>{if(!Array.isArray(p)||p.length<2||!Number.isFinite(p[0])||!Number.isFinite(p[1])||Math.abs(p[0])>180||Math.abs(p[1])>90)throw Error('Invalid longitude/latitude');return [p[1],p[0]];});if(points[0][0]===points.at(-1)[0]&&points[0][1]===points.at(-1)[1])points.pop();if(points.length<3)throw Error('Not enough unique vertices');stopWatch();vertices=points;verified=false;drawing=false;renderPolygon();map.fitBounds(polygon.getBounds());fenceStatus.textContent='GeoJSON imported as UNVERIFIED boundary. Confirm its source and coordinates before operational use.';}catch(err){fenceStatus.textContent=`Import failed: ${err.message}`;}e.target.value='';};
 document.getElementById('map-watch').onclick=()=>{if(watchId!==null){stopWatch();fenceStatus.textContent='GPS monitoring stopped.';return;}if(vertices.length<3){fenceStatus.textContent='Draw or import a polygon before starting GPS monitoring.';return;}if(!navigator.geolocation){fenceStatus.textContent='Browser geolocation is unavailable.';return;}fenceStatus.textContent='Requesting permission for advisory GPS monitoring…';watchId=navigator.geolocation.watchPosition(p=>{const lat=p.coords.latitude,lng=p.coords.longitude,accuracy=p.coords.accuracy;if(marker)map.removeLayer(marker);marker=L.circleMarker([lat,lng],{radius:8,color:'#0f6b44',fillColor:'#fff',fillOpacity:1,weight:3}).addTo(map);const inside=pointInside(lat,lng,vertices);fenceStatus.textContent=`GPS estimate: ${inside?'inside':'outside'} the ${verified?'imported':'draft'} polygon (accuracy ±${Math.round(accuracy)} m). Boundary proximity may be uncertain. Advisory only; no data saved or shift changed.`;},e=>{fenceStatus.textContent=`GPS monitoring error: ${e.message}`;stopWatch();},{enableHighAccuracy:true,maximumAge:10000,timeout:15000});document.getElementById('map-watch').textContent='Stop GPS monitoring';};

 document.getElementById('map-gps').onclick=()=>{
  if(!navigator.geolocation){status.textContent='GPS is unavailable in this browser.';return;}
  status.textContent='Requesting browser location permission…';
  navigator.geolocation.getCurrentPosition(p=>{
   const ll=[p.coords.latitude,p.coords.longitude];
   if(marker)map.removeLayer(marker);
   marker=L.circleMarker(ll,{radius:8,color:'#0f6b44',fillColor:'#fff',fillOpacity:1,weight:3}).addTo(map).bindPopup('Your approximate location');
   map.setView(ll,16);
   status.textContent=`Your location accuracy: ±${Math.round(p.coords.accuracy)} m. Coordinates are not saved.`;
  },e=>status.textContent=`Location unavailable: ${e.message}`,{enableHighAccuracy:true,timeout:12000});
 };
 requestAnimationFrame(()=>map.invalidateSize());
}
