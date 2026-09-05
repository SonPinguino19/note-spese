import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL, key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const db=url&&key?createClient(url,key):null;
export async function listExpenses(){const rows=[];let offset=0;while(true){const {data,error}=await db.from('expenses').select('*').order('date',{ascending:false}).order('id').range(offset,offset+499);if(error)throw error;if(!data.length)break;rows.push(...data.map(({payload,id})=>({...payload,id})));offset+=data.length;}return rows;}
export async function saveExpenses(rows){const {error}=await db.from('expenses').upsert(rows.map(r=>({id:r.id,payload:r,date:r.date})));if(error)throw error;}
export async function removeExpenses(ids){const {error}=await db.from('expenses').delete().in('id',ids);if(error)throw error;}
