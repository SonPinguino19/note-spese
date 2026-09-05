import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL, key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const db=url&&key?createClient(url,key):null;
export async function listExpenses(){const {data,error}=await db.from('expenses').select('*').order('date',{ascending:false});if(error)throw error;return data.map(({payload,id})=>({...payload,id}));}
export async function saveExpenses(rows){const {error}=await db.from('expenses').upsert(rows.map(r=>({id:r.id,payload:r,date:r.date})));if(error)throw error;}
export async function removeExpenses(ids){const {error}=await db.from('expenses').delete().in('id',ids);if(error)throw error;}
