// Fieldwork and welfare workflows. Advisory only; NOT an emergency alerting system.
export async function safetyFieldworkPage(page,{db,checked,box,notice,esc,date,state,staff}){
 const uid=state.user?.id;
 if(!uid)throw Error('Sign in required');
 const get=(id)=>document.getElementById(id);
 const select=async(table)=>checked(db.from(table).select('*').order('created_at',{ascending:false}).limit(150));
 const action=async(button,fn)=>{button.disabled=true;try{await fn();notice('Saved successfully.');await safetyFieldworkPage(page,{db,checked,box,notice,esc,date,state,staff});}catch(e){notice(e.message,true);button.disabled=false}};
 const fmt=x=>esc(date(x));
 const field=(key,label,required=false)=>`<label class="field">${esc(label)}<input name="${key}" ${required?'required':''} maxlength="180"></label>`;
 const options=['Native Wildlife','Native Flora','Invasive Weed','Restoration Activity','Other Observation'];
 if(page==='Safety Check-In'){
  const shifts=await checked(db.from('shifts').select('id,activity,start_time,end_time').eq('user_id',uid).is('end_time',null).order('start_time',{ascending:false}).limit(5));
  const active=shifts[0];
  const rows=await checked(db.from('volunteer_welfare_checks').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(15));
  const latest=rows[0];
  box(`<article class="card"><h2>Volunteer safety check-in</h2><p><strong>For emergencies, call 000.</strong> This page is not monitored emergency dispatch, and a saved check-in does not notify a ranger or emergency services.</p><p class="muted">Check-ins are visible to authorised staff. No GPS coordinates are stored.</p>${active?`<p>Active shift: ${esc(active.activity||'Volunteer activity')} — started ${fmt(active.start_time)}</p>`:'<p class="status">You have no active shift. You can still submit a welfare check-in.</p>'}<div class="actions"><button class="btn" id="safe">I am safe</button><button class="btn secondary" id="need-help">I need assistance</button></div><div id="welfare-details" hidden><label class="field">Message for staff (do not use for emergencies)<textarea id="welfare-note" maxlength="1000"></textarea></label><button class="btn" id="send-help">Record assistance request</button></div><p class="muted">Last recorded check-in: ${latest?`${fmt(latest.created_at)} — ${esc(latest.status)}`:'None'}</p></article><article class="card"><h2>Recent check-ins</h2><div class="table-scroll"><table><thead><tr><th>Time</th><th>Status</th><th>Note</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${fmt(r.created_at)}</td><td>${esc(r.status)}</td><td>${esc(r.note||'—')}</td></tr>`).join('')||'<tr><td colspan="3">No records yet</td></tr>'}</tbody></table></div></article>`);
  const submit=async(status,note='')=>checked(db.from('volunteer_welfare_checks').insert({user_id:uid,shift_id:active?.id||null,status,note}).select('id')).then(r=>{if(r.length!==1)throw Error('Check-in not confirmed')});
  get('safe').onclick=e=>action(e.currentTarget,()=>submit('safe'));
  get('need-help').onclick=()=>{get('welfare-details').hidden=false;get('welfare-note').focus();};
  get('send-help').onclick=e=>action(e.currentTarget,()=>submit('assistance_requested',get('welfare-note').value.trim()));
  return;
 }
 if(page==='Safety Overview'){
  if(!staff())throw Error('Staff permission required');
  const [checks,shifts]=await Promise.all([select('volunteer_welfare_checks'),checked(db.from('shifts').select('id,user_id,volunteer_name,activity,start_time,end_time').is('end_time',null).limit(150))]);
  const latest=new Map();for(const c of checks){if(!latest.has(c.user_id))latest.set(c.user_id,c);}
  const overdue=shifts.filter(s=>Date.now()-new Date(s.start_time).getTime()>5*3600000);
  const help=checks.filter(c=>c.status==='assistance_requested'&&!c.resolved_at);
  box(`<article class="card"><h2>Volunteer welfare overview</h2><p><strong>Manual review only.</strong> This page does not send notifications or monitor shifts when nobody is signed in. Contact volunteers directly using established procedures.</p><div class="attendance-metrics"><div class="metric"><strong>${shifts.length}</strong><span>Open shifts</span></div><div class="metric"><strong>${overdue.length}</strong><span>Shifts over 5 hours</span></div><div class="metric"><strong>${help.length}</strong><span>Unresolved assistance requests</span></div></div><h3>Assistance requests</h3><div class="table-scroll"><table><thead><tr><th>Volunteer ID</th><th>Time</th><th>Message</th><th>Action</th></tr></thead><tbody>${help.map(c=>`<tr><td>${esc(c.user_id)}</td><td>${fmt(c.created_at)}</td><td>${esc(c.note||'—')}</td><td><button class="btn secondary" data-resolve="${esc(c.id)}">Mark reviewed</button></td></tr>`).join('')||'<tr><td colspan="4">No unresolved requests</td></tr>'}</tbody></table></div><h3>Open shifts</h3><div class="table-scroll"><table><thead><tr><th>Volunteer</th><th>Started</th><th>Last check-in</th><th>Review</th></tr></thead><tbody>${shifts.map(s=>{const c=latest.get(s.user_id);const isOld=Date.now()-new Date(s.start_time).getTime()>5*3600000;return `<tr><td>${esc(s.volunteer_name||s.user_id)}</td><td>${fmt(s.start_time)}</td><td>${c?fmt(c.created_at):'None'}</td><td>${isOld?'Over 5 hours — follow up':'—'}</td></tr>`}).join('')||'<tr><td colspan="4">No open shifts</td></tr>'}</tbody></table></div></article>`);
  get('content')?.querySelectorAll('[data-resolve]').forEach(b=>b.onclick=e=>action(e.currentTarget,async()=>{const r=await checked(db.rpc('resolve_welfare_request',{p_id:b.dataset.resolve}));}));
  return;
 }
 if(page==='Field Sightings'){
  const rows=await checked(db.from('conservation_field_records').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(100));
  box(`<article class="card"><h2>Conservation field records</h2><p class="muted">Record wildlife, plants, invasive weeds and restoration work. Location is a descriptive work zone; precise GPS coordinates are not stored.</p><form id="field-form">${field('species','Species / activity',true)}<label class="field">Category<select name="category">${options.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label>${field('work_zone','Work zone / landmark',true)}<label class="field">Quantity (optional)<input name="quantity" type="number" min="0" max="100000" step="0.1"></label><label class="field">Observation details<textarea name="notes" maxlength="2000"></textarea></label><button class="btn">Save field record</button></form></article><article class="card"><h2>My observations</h2><div class="table-scroll"><table><thead><tr><th>Date</th><th>Category</th><th>Species / activity</th><th>Zone</th><th>Quantity</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${fmt(r.created_at)}</td><td>${esc(r.category)}</td><td>${esc(r.species)}</td><td>${esc(r.work_zone)}</td><td>${esc(r.quantity??'—')}</td></tr>`).join('')||'<tr><td colspan="5">No field records yet</td></tr>'}</tbody></table></div></article>`);
  get('field-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);const b=e.submitter;action(b,async()=>{const payload={user_id:uid,species:String(f.get('species')||'').trim(),category:String(f.get('category')),work_zone:String(f.get('work_zone')||'').trim(),notes:String(f.get('notes')||'').trim(),quantity:f.get('quantity')===''?null:Number(f.get('quantity'))};if(!payload.species||!payload.work_zone)throw Error('Species/activity and work zone are required');const r=await checked(db.from('conservation_field_records').insert(payload).select('id'));if(r.length!==1)throw Error('Field record not confirmed');});};
  return;
 }
 if(page==='Field Records'){
  if(!staff())throw Error('Staff permission required');
  const rows=await select('conservation_field_records');
  box(`<article class="card"><h2>Conservation observations</h2><p class="muted">Staff review. Latest 150 records; use data exports for complete reporting.</p><div class="table-scroll"><table><thead><tr><th>Date</th><th>Category</th><th>Species / activity</th><th>Work zone</th><th>Quantity</th><th>Notes</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${fmt(r.created_at)}</td><td>${esc(r.category)}</td><td>${esc(r.species)}</td><td>${esc(r.work_zone)}</td><td>${esc(r.quantity??'—')}</td><td>${esc(r.notes||'—')}</td></tr>`).join('')||'<tr><td colspan="6">No observations yet</td></tr>'}</tbody></table></div></article>`);
 }
}
