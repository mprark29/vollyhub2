export async function workflowPage(page,ctx){
 const {db,checked,box,notice,esc,date,state,staff,admin}=ctx;
 const el=(id)=>document.getElementById(id);
 const field=(name,label,type='text',required=false)=>`<label class="field">${esc(label)}<input name="${esc(name)}" type="${type}" ${required?'required':''}></label>`;
 const textarea=(name,label)=>`<label class="field">${esc(label)}<textarea name="${esc(name)}"></textarea></label>`;
 const form=(id,title,body,button='Save to Supabase')=>`<article class="card"><h2>${esc(title)}</h2><form id="${id}">${body}<button class="btn" type="submit">${esc(button)}</button></form></article>`;
 const attach=(id,fn)=>{el(id).addEventListener('submit',async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{await fn(new FormData(e.target));notice('Saved to Supabase successfully.');if(e.target.isConnected)e.target.reset();}catch(error){notice(`Database operation failed: ${error.message}`,true)}finally{b.disabled=false}})};
 const read=async(table,columns='*',limit=100)=>checked(db.from(table).select(columns).limit(limit));
 const renderRows=(rows,cols)=>`<div class="table-scroll"><table><thead><tr>${cols.map(x=>`<th>${esc(x[1])}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(x=>`<td>${esc(x[2]?x[2](r[x[0]]):r[x[0]])}</td>`).join('')}<td data-actions="${esc(r.id)}"></td></tr>`).join('')}</tbody></table></div>`;
 const bindActions=(rows,fn)=>rows.forEach(r=>{const cell=[...document.querySelectorAll('[data-actions]')].find(x=>x.dataset.actions===String(r.id));if(cell)fn(cell,r)});
 const act=(cell,label,handler)=>{const b=document.createElement('button');b.className='btn secondary';b.type='button';b.textContent=label;b.onclick=async()=>{b.disabled=true;try{await handler();notice('Change saved to Supabase.');await workflowPage(page,ctx)}catch(e){notice(`Operation failed: ${e.message}`,true)}finally{b.disabled=false}};cell.append(b)};
 if(page==='Event Management'){
  if(!staff())throw Error('Staff permission required');
  const rows=await read('events','id,title,date,zone,activity,description,max_capacity',150);
  box(form('event-form','Create park event',field('title','Event title','text',true)+field('date','Event date','date',true)+field('zone','Park zone')+field('activity','Activity')+field('max_capacity','Capacity','number')+textarea('description','Description'),'Create event')+`<article class="card"><h2>Existing events</h2>${renderRows(rows,[['title','Event'],['date','Date'],['zone','Zone']])}</article>`);
  attach('event-form',async f=>{const payload={title:String(f.get('title')),date:String(f.get('date')),zone:String(f.get('zone')||''),activity:String(f.get('activity')||''),description:String(f.get('description')||'')};if(f.get('max_capacity'))payload.max_capacity=Number(f.get('max_capacity'));await checked(db.from('events').insert(payload).select('id'));await workflowPage(page,ctx)});
  bindActions(rows,(cell,r)=>{act(cell,'Edit',async()=>{const title=prompt('Event title',r.title);if(title===null)return;const zone=prompt('Park zone',r.zone||'');if(zone===null)return;await checked(db.from('events').update({title,zone}).eq('id',r.id).select('id')).then(rows=>{if(!rows?.length)throw Error('Event was not updated (check permissions)')})});act(cell,'Delete',async()=>{if(!confirm(`Delete event “${r.title}”?`))return;await checked(db.from('events').delete().eq('id',r.id).select('id')).then(rows=>{if(!rows?.length)throw Error('Event was not deleted (check permissions)')})})});return;
 }
 if(page==='Report Hazard'){
  if(!state.user)throw Error('Sign in to submit a volunteer hazard report');
  box(form('hazard-form','Report a park hazard',field('type','Hazard type','text',true)+`<label class="field">Severity<select name="severity"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>`+field('zone','Park zone','text',true)+textarea('description','Description'),'Submit hazard'));
  attach('hazard-form',async f=>{await checked(db.from('hazards').insert({type:String(f.get('type')),severity:String(f.get('severity')),zone:String(f.get('zone')),description:String(f.get('description')||''),status:'open',reported_by_id:state.user.id}).select('id'))});return;
 }
 if(page==='Hazard Management'){
  if(!staff())throw Error('Staff permission required');const rows=await read('hazards','*',150);
  box(`<article class="card"><h2>Volunteer hazard reports</h2><p class="muted">Guest reports are held separately; this view does not expose private guest contact details.</p>${renderRows(rows,[['type','Type'],['severity','Severity'],['zone','Zone'],['status','Status']])}</article>`);
  bindActions(rows,(cell,r)=>act(cell,'Update status',async()=>{const status=prompt('New status (open, in_progress, resolved)',r.status||'open');if(status===null)return;if(!['open','in_progress','resolved'].includes(status))throw Error('Choose open, in_progress or resolved');await checked(db.from('hazards').update({status}).eq('id',r.id).select('id')).then(rows=>{if(!rows?.length)throw Error('Hazard was not updated (check permissions)')})}));return;
 }
 if(page==='Submit Photo'){
  if(!state.user)throw Error('Sign in to upload a photo');
  box(form('photo-form','Submit photo for moderation',field('caption','Caption','text',true)+field('zone','Park zone','text',true)+`<label class="field">Image (JPEG, PNG or WebP, up to 8 MB)<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required></label>`,'Upload photo'));
  attach('photo-form',async f=>{const file=f.get('photo');if(!(file instanceof File)||!file.size)throw Error('Choose an image');if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)throw Error('Use a JPEG, PNG or WebP under 8 MB');const ext=({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[file.type];const path=`${state.user.id}/${crypto.randomUUID()}.${ext}`;const {error}=await db.storage.from('volunteer-gallery').upload(path,file,{contentType:file.type,upsert:false});if(error)throw Error(`Storage upload failed: ${error.message}. Confirm the gallery bucket name and upload policy before retrying.`);try{await checked(db.from('photos').insert({caption:String(f.get('caption')),zone:String(f.get('zone')),storage_path:path,status:'pending',uploaded_by_id:state.user.id}).select('id'))}catch(e){await db.storage.from('volunteer-gallery').remove([path]);throw e}});return;
 }
 if(page==='Photo Moderation'){
  if(!staff())throw Error('Staff permission required');const rows=await read('photos','id,caption,zone,status,storage_path,created_at',150);
  box(`<article class="card"><h2>Photo moderation</h2>${renderRows(rows,[['caption','Caption'],['zone','Zone'],['status','Status'],['created_at','Submitted',date]])}</article>`);
  bindActions(rows,(cell,r)=>{for(const status of ['approved','rejected'])act(cell,status==='approved'?'Approve':'Reject',async()=>await checked(db.from('photos').update({status}).eq('id',r.id).select('id')).then(rows=>{if(!rows?.length)throw Error('Photo was not updated (check permissions)')}));if(r.storage_path)act(cell,'View private image',async()=>{const {data,error}=await db.storage.from('volunteer-gallery').createSignedUrl(r.storage_path,60);if(error)throw error;window.open(data.signedUrl,'_blank','noopener,noreferrer')})});return;
 }
 if(page==='Clock In/Out'){
  if(!state.user)throw Error('Sign in to record attendance');
  const rows=await checked(db.from('shifts').select('id,start_time,end_time,status,activity').eq('user_id',state.user.id).order('start_time',{ascending:false}).limit(20));const active=rows.find(x=>!x.end_time);
  box(`<article class="card"><h2>Volunteer attendance</h2><p>${active?'You have an open shift.':'You are currently clocked out.'}</p>${active?'<button id="clock-out" class="btn">Clock out</button>':form('clock-in','Start shift',field('activity','Activity','text',true)+field('park_zone','Park zone'),'Clock in')}<h2>Recent shifts</h2>${renderRows(rows,[['activity','Activity'],['start_time','Start',date],['end_time','End',date],['status','Status']])}</article>`);
  if(active)el('clock-out').onclick=async()=>{try{const end=new Date().toISOString();const hours=Math.max(0,(Date.now()-new Date(active.start_time).getTime())/3600000);const changed=await checked(db.from('shifts').update({end_time:end,hours:Number(hours.toFixed(2))}).eq('id',active.id).eq('user_id',state.user.id).select('id'));if(!changed?.length)throw Error('Clock-out was not saved. Check shift permissions.');notice('Clocked out and saved.');await workflowPage(page,ctx)}catch(e){notice(e.message,true)}};
  else attach('clock-in',async f=>{const profile=await checked(db.from('profiles').select('name').eq('id',state.user.id).single());await checked(db.from('shifts').insert({user_id:state.user.id,volunteer_name:profile.name,activity:String(f.get('activity')),park_zone:String(f.get('park_zone')||''),start_time:new Date().toISOString(),status:'pending'}).select('id'));await workflowPage(page,ctx)});return;
 }
}
