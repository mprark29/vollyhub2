import {db,checked} from './db.js';
// Best effort foreground tracking; browser background tracking is NOT guaranteed.
let watchId=null,activeShift=null,owner=null,lastSent=0,pending=false,monitorGeneration=0;
export function stopAttendanceMonitor(){monitorGeneration++;pending=false;if(watchId!==null&&navigator.geolocation)navigator.geolocation.clearWatch(watchId);watchId=null;activeShift=null;owner=null;lastSent=0;}
export async function startAttendanceMonitor(userId,onStatus=()=>{}){
 stopAttendanceMonitor();if(!userId||!navigator.geolocation)return;
 owner=userId;const generation=monitorGeneration;
 try{
  const rows=await checked(db.from('shifts').select('id').eq('user_id',userId).is('end_time',null).order('start_time',{ascending:false}).limit(1));
  if(generation!==monitorGeneration||owner!==userId||!rows.length)return;
  activeShift=String(rows[0].id);
  watchId=navigator.geolocation.watchPosition(async pos=>{
   if(generation!==monitorGeneration||pending||owner!==userId||!activeShift||Date.now()-lastSent<10000)return;
   pending=true;lastSent=Date.now();
   try{
    const {data,error}=await db.rpc('report_shift_location',{p_shift_id:activeShift,p_lat:pos.coords.latitude,p_lon:pos.coords.longitude,p_accuracy:pos.coords.accuracy});
    if(error)throw error;
    if(generation!==monitorGeneration)return;
    if(data?.closed){onStatus(data.reason==='shift_not_active'?'Shift ended.':'Automatically clocked out: confirmed more than 100 m outside the park.');stopAttendanceMonitor();}
    else if(data?.ignored)onStatus('GPS accuracy insufficient for geofence monitoring.');
   }catch(e){if(generation===monitorGeneration)onStatus('GPS monitoring failed: '+e.message);}finally{pending=false;}
  },e=>{if(generation===monitorGeneration)onStatus('GPS monitoring unavailable: '+e.message);},{enableHighAccuracy:true,maximumAge:0,timeout:20000});
 }catch(e){onStatus('Could not start GPS monitoring: '+e.message);}
}
