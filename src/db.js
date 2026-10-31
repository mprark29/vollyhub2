import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './config.js';
import {createClient} from '@supabase/supabase-js';
export const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export async function checked(promise){const {data,error}=await promise;if(error)throw error;return data;}
export async function resolveAccess(user){
 if(!user)return {level:'guest',roles:[]};
 // Do not grant access based on local state, user metadata or an email address.
 const assignments=await checked(db.from('user_roles').select('role_id').eq('user_id',user.id));
 const ids=[...new Set((assignments||[]).map(x=>String(x.role_id)).filter(Boolean))];
 if(!ids.length)return {level:'volunteer',roles:[]};
 const rows=await checked(db.from('roles').select('id,name').in('id',ids));
 const names=(rows||[]).map(x=>`${x.id} ${x.name}`.toLowerCase());
 const level=names.some(x=>/admin|master/.test(x))?'admin':names.some(x=>/manager|staff|coordinator/.test(x))?'staff':'volunteer';
 return {level,roles:rows||[]};
}
