// One-time, user-initiated GPS attendance precheck. Never uploads coordinates.
export async function checkParkPosition(db){
 if(!navigator.geolocation)throw Error('Browser location not available');
 const position=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:15000,maximumAge:0}));
 const {latitude:lat,longitude:lng,accuracy}=position.coords;
 const {data,error}=await db.from('park_geofences').select('geometry').eq('status','active').limit(1).maybeSingle();
 if(error||!data?.geometry?.coordinates?.[0])throw Error('Active park boundary unavailable');
 const ring=data.geometry.coordinates[0];let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const [xi,yi]=ring[i], [xj,yj]=ring[j];if(((yi>lat)!==(yj>lat))&&(lng<(xj-xi)*(lat-yi)/(yj-yi)+xi))inside=!inside;
 }
 return {inside,accuracy,message:`GPS suggests ${inside?'INSIDE':'OUTSIDE'} the park boundary (accuracy ±${Math.round(accuracy)} m). ${accuracy>50?'Low accuracy; result is uncertain. ':''}Advisory only. You may clock in regardless; coordinates are not saved.`};
}
