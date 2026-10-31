import L from 'leaflet';
import {db} from './db.js';

// Approximate map centre only. No surveyed park boundary is asserted.
const CENTER=[-27.900035,153.392267];
const OFFICIAL_BOUNDARY=[[-27.90085,153.38864],[-27.90067,153.38866],[-27.90066,153.3886],[-27.89612,153.38901],[-27.89323,153.38887],[-27.89437,153.39651],[-27.89468,153.39676],[-27.90186,153.39541],[-27.9021,153.39701],[-27.90719,153.39747],[-27.90685,153.39518],[-27.90771,153.39525],[-27.90761,153.39471],[-27.90747,153.39357],[-27.90733,153.39286],[-27.90723,153.39213],[-27.90643,153.39228],[-27.90582,153.38815],[-27.90084,153.38859]];
let activeMap=null;
const safeText=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validRing=(coords)=>Array.isArray(coords)&&coords.length>=4&&coords.length<=10000&&coords.every(p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90);

let stopLocationWatch=null;
export async function renderParkMap({box,notice,canManage=false,canTrack=false}){
 if(stopLocationWatch){try{stopLocationWatch();}catch(e){console.warn('Previous map GPS cleanup:',e);}stopLocationWatch=null;}
 if(activeMap){try{activeMap.remove();}catch(e){console.warn('Previous map cleanup:',e);}activeMap=null;}
 box(`<article class="card park-map-card"><div class="section-heading"><div><h2>Pine Ridge Conservation Park — interactive map</h2><p class="muted">Real satellite basemap. Queensland Government WetlandInfo published conservation-park boundary (simplified). GPS status is advisory only.</p></div></div><div class="map-toolbar"><button class="btn secondary" id="map-satellite">Satellite</button><button class="btn secondary" id="map-streets">Street map</button><button class="btn secondary" id="map-center">Return to park</button><button class="btn secondary" id="map-gps">My location</button>${canManage?`<button class="btn secondary" id="map-draw">Draw boundary</button><button class="btn secondary" id="map-finish">Finish boundary</button><button class="btn secondary" id="map-clear">Clear boundary</button><button class="btn secondary" id="map-restore">Restore official boundary</button><button class="btn secondary" id="map-export">Export GeoJSON</button><label class="btn secondary" for="map-import">Import GeoJSON</label><input id="map-import" type="file" accept=".json,.geojson,application/json" hidden><button class="btn secondary" id="map-publish">Save draft to Supabase</button>`:''}${canManage?'<button class="btn secondary" id="zone-draw">Draw work zone</button><button class="btn secondary" id="zone-finish">Finish work zone</button><button class="btn secondary" id="zone-save">Save zone draft</button>':''}${canTrack?'<button class="btn secondary" id="map-watch">Start GPS monitoring</button>':''}<a class="btn secondary" href="https://www.google.com/maps?q=-27.900035,153.392267" target="_blank" rel="noopener noreferrer">Open Google Maps</a></div><div id="park-leaflet-map" role="region" aria-label="Interactive satellite map of the Pine Ridge area" style="height:540px;min-height:380px;border-radius:12px;background:#1c3d2e"></div><p class="muted" id="map-status" aria-live="polite">Satellite imagery loads from Esri World Imagery. Zoom and pan with the map.</p><p id="geofence-status" class="muted" aria-live="polite">Government-published boundary loaded. Simplified within 0.00001 degrees; GPS monitoring is advisory only. No automatic clock-out, staff alerts or location storage.</p><div class="card" style="margin-top:12px"><h3>Work zones</h3><p id="workzone-status" class="muted">Loading active work zones…</p><div id="workzone-list"></div>${canManage?'<div id="workzone-admin"></div>':''}</div><p class="muted">GPS may be inaccurate or unavailable. This is not a lone-worker safety system.</p></article>`);
 const status=document.getElementById('map-status');
 const publishButton=document.getElementById('map-publish');
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
 const zoneStatus=document.getElementById('workzone-status'),zoneList=document.getElementById('workzone-list');
 let zones=[],zoneLayers=[],zoneDraft=[],zoneDrawing=false,zoneDraftLayer=null,lastZoneStatus='',lastFenceStatus='';
 const zoneValid=(z)=>z?.geometry?.type==='Polygon'&&validRing(z.geometry.coordinates?.[0]);
 const zonePoints=(z)=>z.geometry.coordinates[0].map(p=>[p[1],p[0]]);
 const zoneColor=(value)=>/^#[0-9a-fA-F]{6}$/.test(value||'')?value:'#147d69';
 // Compact, constant-pixel-size markers avoid overlapping long labels on mobile.
 // The zone list provides the full names, including when markers are close together.
 const drawZones=()=>{
  zoneLayers.forEach(l=>map.removeLayer(l));zoneLayers=[];
  const rendered=[];
  zones.forEach((z,i)=>{
   if(!zoneValid(z))return;
   const color=zoneColor(z.color),name=String(z.name||'Unnamed zone');
   const l=L.polygon(zonePoints(z),{color,fillColor:color,fillOpacity:.16,weight:3}).addTo(map);
   const detail=`<strong>Zone ${i+1}: ${safeText(name)}</strong>${z.description?`<p>${safeText(z.description)}</p>`:''}`;
   // The polygon itself is the tap target: no marker or floating label.
   l.bindPopup(detail,{autoPan:true});
   l.on('mouseover',()=>l.setStyle({fillOpacity:.30,weight:4}));
   l.on('mouseout',()=>l.setStyle({fillOpacity:.16,weight:3}));
   zoneLayers.push(l);rendered.push({zone:z,index:i,polygon:l});
  });
  zoneList.innerHTML=rendered.map(({zone:z,index:i})=>`<button type="button" class="workzone-list-item" data-zone-index="${i}" aria-label="Locate zone ${i+1}: ${safeText(z.name)}"><span class="workzone-legend-number" style="--zone-color:${zoneColor(z.color)}">${i+1}</span><span><strong>${safeText(z.name)}</strong><small>${safeText(z.description||'Tap to find on map')}</small></span><span aria-hidden="true">⌖</span></button>`).join('')||'<p class="muted">No active work zones published yet.</p>';
  zoneList.querySelectorAll('[data-zone-index]').forEach(button=>button.onclick=()=>{
   const entry=rendered.find(item=>item.index===Number(button.dataset.zoneIndex));if(!entry)return;
   map.fitBounds(entry.polygon.getBounds(),{padding:[40,40],maxZoom:17});
   entry.polygon.openPopup();
   document.getElementById('park-leaflet-map')?.scrollIntoView({behavior:'smooth',block:'center'});
  });
 };

 const loadZones=async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6500);try{const {data,error}=await db.from('park_work_zones').select('id,name,description,geometry,color,status').eq('status','active').abortSignal(controller.signal).limit(100);if(error)throw error;if(activeMap!==map||!zoneStatus.isConnected)return;zones=(data||[]).filter(zoneValid);drawZones();zoneStatus.textContent=`${zones.length} active work zone(s) loaded from Supabase.`;}catch(e){if(activeMap===map&&zoneStatus.isConnected)zoneStatus.textContent=`Work zones unavailable: ${e.message}. Apply the work-zones SQL migration.`;}finally{clearTimeout(timer);}};
 void loadZones();
 // Private observation markers: only loaded for signed-in volunteers; RLS limits to own records or staff.
 if(canTrack){
  const observationLayer=L.layerGroup().addTo(map);
  const control=L.control({position:'topright'});
  control.onAdd=()=>{const wrap=L.DomUtil.create('div','leaflet-bar leaflet-control');const button=L.DomUtil.create('button','',wrap);button.type='button';button.textContent='Sightings';button.title='Show or hide recorded GPS sightings';button.style.cssText='background:white;padding:6px;cursor:pointer;border:0;font-weight:600';L.DomEvent.disableClickPropagation(wrap);button.onclick=()=>{if(map.hasLayer(observationLayer)){map.removeLayer(observationLayer);button.textContent='Show sightings';}else{observationLayer.addTo(map);button.textContent='Hide sightings';}};return wrap;};control.addTo(map);
  const {data,error}=await db.from('conservation_field_records').select('id,category,species,work_zone,latitude,longitude').not('latitude','is',null).limit(300);
  if(!error&&activeMap===map){for(const r of data||[]){if(!Number.isFinite(r.latitude)||!Number.isFinite(r.longitude))continue;L.circleMarker([r.latitude,r.longitude],{radius:5,color:'#ffe082',fillColor:'#146f49',fillOpacity:.9,weight:2}).bindPopup(`<strong>${safeText(r.species)}</strong><p>${safeText(r.category)} · ${safeText(r.work_zone)}</p>`).addTo(observationLayer);}}
 }

 const loadAdminZones=async()=>{if(!canManage)return;const panel=document.getElementById('workzone-admin');if(!panel)return;const {data,error}=await db.from('park_work_zones').select('id,name,status,created_at').order('created_at',{ascending:false}).limit(50);if(error){panel.textContent=`Zone management unavailable: ${error.message}`;return;}panel.innerHTML='<h4>Administrator: work-zone approvals</h4>'+(data||[]).map(z=>`<div class="map-zone-admin-row"><strong>${safeText(z.name)}</strong> (${safeText(z.status)}) <button class="btn secondary" data-zone-id="${safeText(z.id)}" data-zone-action="${z.status==='active'?'retired':'active'}">${z.status==='active'?'Retire':'Activate'}</button></div>`).join('');panel.querySelectorAll('[data-zone-action]').forEach(b=>{b.onclick=async()=>{b.disabled=true;try{const {error}=await db.rpc('set_park_work_zone_status',{p_id:b.dataset.zoneId,p_status:b.dataset.zoneAction});if(error)throw error;zoneStatus.textContent='Work-zone status updated.';await Promise.all([loadZones(),loadAdminZones()]);}catch(e){zoneStatus.textContent=`Zone update failed: ${e.message}`;b.disabled=false;}};});};
 void loadAdminZones();

 const drawZoneDraft=()=>{if(zoneDraftLayer)map.removeLayer(zoneDraftLayer);zoneDraftLayer=zoneDraft.length>=2?L.polygon(zoneDraft,{color:'#ff8c00',dashArray:'5 5',fillOpacity:.18}).addTo(map):null;};
 if(canManage){document.getElementById('zone-draw').onclick=()=>{zoneDrawing=true;zoneDraft=[];drawZoneDraft();zoneStatus.textContent='Click map points to draw a work zone; then Finish work zone.';};document.getElementById('zone-finish').onclick=()=>{if(zoneDraft.length<3){zoneStatus.textContent='At least three vertices are required.';return;}zoneDrawing=false;zoneStatus.textContent='Zone outline ready. Save as draft for administrator review.';};document.getElementById('zone-save').onclick=async()=>{if(zoneDrawing||zoneDraft.length<3){zoneStatus.textContent='Finish a valid work-zone polygon first.';return;}const name=prompt('Work zone name');if(!name?.trim())return;const description=prompt('Work zone description (optional)')||'';const ring=zoneDraft.map(([lat,lng])=>[lng,lat]);ring.push([...ring[0]]);try{const {data:{user},error:authError}=await db.auth.getUser();if(authError||!user)throw Error('Administrator sign-in required');const {error}=await db.from('park_work_zones').insert({name:name.trim(),description,geometry:{type:'Polygon',coordinates:[ring]},status:'draft',created_by:user.id});if(error)throw error;zoneStatus.textContent='Work zone saved as draft. Activate it in the administrator approvals list.';zoneDraft=[];drawZoneDraft();await loadAdminZones();}catch(e){zoneStatus.textContent=`Unable to save zone: ${e.message}`;}};}
 map.on('click',e=>{if(!zoneDrawing)return;zoneDraft.push([e.latlng.lat,e.latlng.lng]);drawZoneDraft();zoneStatus.textContent=`Work zone vertices: ${zoneDraft.length}`;});

 let polygon=null,vertices=OFFICIAL_BOUNDARY.map(point=>[...point]),drawing=false,verified=true,watchId=null,watchCleanup=null;
 const pointInside=(lat,lng,pts)=>{let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [yi,xi]=pts[i], [yj,xj]=pts[j];if(((xi>lng)!==(xj>lng))&&(lat<(yj-yi)*(lng-xi)/(xj-xi)+yi))inside=!inside;}return inside;};
 const renderPolygon=()=>{if(polygon)map.removeLayer(polygon);polygon=vertices.length>=2?L.polygon(vertices,{color:verified?'#146f49':'#f59e0b',fillOpacity:.13,dashArray:verified?null:'7 5'}).addTo(map):null;};
 // Render the bundled boundary immediately. Never block the map on a database request.
 renderPolygon();
 map.fitBounds(polygon.getBounds(),{padding:[20,20]});
 fenceStatus.textContent='Government-published boundary displayed. Checking Supabase for the active revision…';
 const mapAtRequest=map;
 const loadActiveBoundary=async()=>{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),6500);
  try{
   const {data,error}=await db.from('park_geofences')
    .select('name,geometry,source_name,revision').eq('status','active').limit(1)
    .abortSignal(controller.signal).maybeSingle();
   if(error)throw error;
   if(activeMap!==mapAtRequest||!fenceStatus.isConnected)return;
   if(data?.geometry?.type==='Polygon' && Array.isArray(data.geometry.coordinates?.[0])){
    const imported=data.geometry.coordinates[0].map(p=>[p[1],p[0]]);
    if(imported.length>3 && imported.every(p=>p.every(Number.isFinite))){
     if(imported[0][0]===imported.at(-1)[0]&&imported[0][1]===imported.at(-1)[1])imported.pop();
     if(!drawing){vertices=imported;verified=true;renderPolygon();map.fitBounds(polygon.getBounds(),{padding:[20,20]});}
     fenceStatus.textContent=`Supabase active boundary: ${data.name} (revision ${data.revision}; ${data.source_name}). GPS monitoring is advisory only.`;
     return;
    }
   }
   fenceStatus.textContent='Bundled government boundary displayed. No active Supabase geofence found.';
  }catch(err){
   if(activeMap===mapAtRequest&&fenceStatus.isConnected)fenceStatus.textContent=`Bundled government boundary displayed. Database lookup unavailable or timed out (${err.message}).`;
  }finally{clearTimeout(timeout);}
 };
 void loadActiveBoundary();
 const stopWatch=()=>{if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null;}if(canTrack){const button=document.getElementById('map-watch');if(button)button.textContent='Start GPS monitoring';}};
 stopLocationWatch=stopWatch;
 if(canManage)publishButton.onclick=async()=>{
  if(!canManage)return;
  if(vertices.length<3){fenceStatus.textContent='Create a valid polygon before saving.';return;}
  if(verified){fenceStatus.textContent='To create a new revision, draw or import a new boundary first. Existing published geometry is immutable.';return;}
  const name=window.prompt('Draft boundary name','Pine Ridge Conservation Park');if(!name?.trim())return;
  const source=window.prompt('Source / authority for this boundary','Pending QPWS verification');if(!source?.trim())return;
  const ring=vertices.map(([lat,lng])=>[lng,lat]);ring.push([...ring[0]]);
  publishButton.disabled=true;
  try{
   const {data:{user},error:authError}=await db.auth.getUser();if(authError||!user)throw Error('Sign in as an administrator');
   const {error}=await db.from('park_geofences').insert({name:name.trim(),geometry:{type:'Polygon',coordinates:[ring]},source_name:source.trim(),status:'draft',created_by:user.id});
   if(error)throw error;
   fenceStatus.textContent='Draft saved to Supabase. It is NOT active. An administrator must review and activate it in the Supabase SQL Editor using the activate_park_geofence function with its record ID.';
  }catch(err){fenceStatus.textContent=`Could not save draft: ${err.message}. Apply supabase/park_geofences.sql first and check admin RLS.`;}
  finally{publishButton.disabled=false;}
 };
 if(canManage)document.getElementById('map-draw').onclick=()=>{stopWatch();drawing=true;verified=false;vertices=[];renderPolygon();fenceStatus.textContent='Draft mode: click the map to place boundary vertices. Add at least three points, then select Finish boundary.';};
 map.on('click',e=>{if(!drawing)return;vertices.push([e.latlng.lat,e.latlng.lng]);renderPolygon();fenceStatus.textContent=`Draft vertices: ${vertices.length}. Select Finish boundary when complete.`;});
 if(canManage)document.getElementById('map-finish').onclick=()=>{if(vertices.length<3){fenceStatus.textContent='At least three vertices are required.';return;}drawing=false;renderPolygon();fenceStatus.textContent='Draft boundary complete. Export it for verification before operational use.';};
 if(canManage)document.getElementById('map-restore').onclick=()=>{stopWatch();drawing=false;vertices=OFFICIAL_BOUNDARY.map(p=>[...p]);verified=true;renderPolygon();map.fitBounds(polygon.getBounds(),{padding:[20,20]});fenceStatus.textContent='Government-published simplified boundary restored. GPS monitoring remains advisory only.';};
 if(canManage)document.getElementById('map-clear').onclick=()=>{stopWatch();drawing=false;vertices=[];verified=false;renderPolygon();fenceStatus.textContent='Boundary cleared. No geofence is active.';};
 if(canManage)document.getElementById('map-export').onclick=()=>{if(vertices.length<3){fenceStatus.textContent='Draw or import a polygon before exporting.';return;}const ring=vertices.map(([lat,lng])=>[lng,lat]);ring.push([...ring[0]]);const data={type:'FeatureCollection',features:[{type:'Feature',properties:{name:'Pine Ridge boundary',status:verified?'government-published-simplified':'draft-unverified',source:verified?'Queensland Government WetlandInfo':undefined},geometry:{type:'Polygon',coordinates:[ring]}}]};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/geo+json'}));const a=document.createElement('a');a.href=url;a.download='pine-ridge-boundary-draft.geojson';a.click();URL.revokeObjectURL(url);fenceStatus.textContent='Boundary exported. Confirm its accuracy with the land manager before relying on it.';};
 if(canManage)document.getElementById('map-import').onchange=async e=>{try{const f=e.target.files?.[0];if(!f)return;if(f.size>1024*1024)throw Error('File exceeds 1 MB');const geo=JSON.parse(await f.text());const geom=geo.type==='FeatureCollection'?geo.features?.[0]?.geometry:geo.type==='Feature'?geo.geometry:geo;if(geom?.type!=='Polygon'||!Array.isArray(geom.coordinates?.[0]))throw Error('Import a GeoJSON Polygon (single outer ring)');const ring=geom.coordinates[0];if(ring.length<4||ring.length>10000)throw Error('Polygon must have 3–9999 vertices');const points=ring.map(p=>{if(!Array.isArray(p)||p.length<2||!Number.isFinite(p[0])||!Number.isFinite(p[1])||Math.abs(p[0])>180||Math.abs(p[1])>90)throw Error('Invalid longitude/latitude');return [p[1],p[0]];});if(points[0][0]===points.at(-1)[0]&&points[0][1]===points.at(-1)[1])points.pop();if(points.length<3)throw Error('Not enough unique vertices');stopWatch();vertices=points;verified=false;drawing=false;renderPolygon();map.fitBounds(polygon.getBounds());fenceStatus.textContent='GeoJSON imported as UNVERIFIED boundary. Confirm its source and coordinates before operational use.';}catch(err){fenceStatus.textContent=`Import failed: ${err.message}`;}e.target.value='';};
 if(canTrack)document.getElementById('map-watch').onclick=()=>{if(watchId!==null){stopWatch();fenceStatus.textContent='GPS monitoring stopped.';return;}if(vertices.length<3){fenceStatus.textContent='Draw or import a polygon before starting GPS monitoring.';return;}if(!navigator.geolocation){fenceStatus.textContent='Browser geolocation is unavailable.';return;}fenceStatus.textContent='Requesting permission for advisory GPS monitoring…';watchId=navigator.geolocation.watchPosition(p=>{const lat=p.coords.latitude,lng=p.coords.longitude,accuracy=p.coords.accuracy;if(marker)map.removeLayer(marker);marker=L.circleMarker([lat,lng],{radius:8,color:'#0f6b44',fillColor:'#fff',fillOpacity:1,weight:3}).addTo(map);const inside=pointInside(lat,lng,vertices);const zone=zones.find(z=>pointInside(lat,lng,zonePoints(z)));const certainty=accuracy>50?'Low GPS accuracy; location may be unreliable.':'';const next=inside?'inside':'outside';if(lastFenceStatus&&lastFenceStatus!==next)fenceStatus.textContent=`Boundary transition detected: ${next.toUpperCase()}. ${certainty} Advisory warning only; contact your team lead if unexpected.`;else fenceStatus.textContent=`GPS estimate: ${next} park boundary; work zone: ${zone?.name||'none'} (accuracy ±${Math.round(accuracy)} m). ${certainty} Advisory only; no data saved.`;lastFenceStatus=next;lastZoneStatus=zone?.name||'';},e=>{fenceStatus.textContent=`GPS monitoring error: ${e.message}`;stopWatch();},{enableHighAccuracy:true,maximumAge:10000,timeout:15000});document.getElementById('map-watch').textContent='Stop GPS monitoring';};

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
