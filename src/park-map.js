import L from 'leaflet';

// Approximate map centre only. No surveyed park boundary is asserted.
const CENTER=[-27.900035,153.392267];
let activeMap=null;
export function renderParkMap({box,notice}){
 if(activeMap){activeMap.remove();activeMap=null;}
 box(`<article class="card park-map-card"><div class="section-heading"><div><h2>Pine Ridge Conservation Park — interactive map</h2><p class="muted">Real satellite basemap. Park work-zone boundaries are not yet georeferenced; use this for orientation, not navigation or safety geofencing.</p></div></div><div class="map-toolbar"><button class="btn secondary" id="map-satellite">Satellite</button><button class="btn secondary" id="map-streets">Street map</button><button class="btn secondary" id="map-center">Return to park</button><button class="btn secondary" id="map-gps">My location</button><a class="btn secondary" href="https://www.google.com/maps?q=-27.900035,153.392267" target="_blank" rel="noopener noreferrer">Open Google Maps</a></div><div id="park-leaflet-map" role="region" aria-label="Interactive satellite map of the Pine Ridge area" style="height:540px;min-height:380px;border-radius:12px;background:#1c3d2e"></div><p class="muted" id="map-status" aria-live="polite">Satellite imagery loads from Esri World Imagery. Zoom and pan with the map.</p><p class="muted">The five original illustrative conservation zones are not displayed on this geographic map until their coordinates can be verified.</p></article>`);
 const status=document.getElementById('map-status');
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
