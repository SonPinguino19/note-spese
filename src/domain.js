export function cents(value) {
  if (typeof value === 'number') { if (!Number.isFinite(value)) throw Error('Importo non valido'); return Math.round(value * 100); }
  let s = String(value ?? '').trim().replace(/[€\s]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) throw Error('Importo non valido');
  return Math.round(Number(s) * 100);
}
export function validDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s; }
export function filterRows(rows, f) { return rows.filter(r => r.date >= f.from && r.date <= f.to && (!f.person || r.person === f.person) && (!f.account || r.account === f.account) && (!f.category || r.category === f.category) && (!f.scope || (r.shared ? 'shared' : 'personal') === f.scope)); }
export function metrics(rows) {
  const income = rows.filter(r=>r.kind==='income').reduce((a,r)=>a+r.amount,0);
  const spending = -rows.filter(r=>r.kind==='expense'||r.kind==='refund').reduce((a,r)=>a+r.amount,0);
  const investments = -rows.filter(r=>r.kind==='investment').reduce((a,r)=>a+r.amount,0);
  const categories = {}; const months = {};
  for (const r of rows) { const m = r.date.slice(0,7); months[m] ??= {income:0,spending:0}; if(r.kind==='income') months[m].income+=r.amount; if(r.kind==='expense'||r.kind==='refund'){ categories[r.category]=(categories[r.category]||0)-r.amount; months[m].spending-=r.amount; } }
  return {income,spending,saving:income-spending,investments,rate:income>0?(income-spending)/income:null,categories,months};
}
export function fingerprint(r) { return [r.date,r.account,r.person,r.amount,r.description.trim().toLowerCase().replace(/\s+/g,' ')].join('|'); }
export function validate(r) { if(!validDate(r.date)) throw Error('Data non valida'); if(!Number.isSafeInteger(r.amount)||r.amount===0) throw Error('Importo non valido'); if(!r.description.trim()||!r.account.trim()||!r.person.trim()) throw Error('Descrizione, conto e persona obbligatori'); if(['expense','investment'].includes(r.kind)&&r.amount>0) throw Error('Le uscite devono essere negative'); if(['income','refund'].includes(r.kind)&&r.amount<0) throw Error('Le entrate devono essere positive'); return r; }
export function previousPeriod(from,to) { const days = Math.round((Date.parse(to)-Date.parse(from))/86400000)+1; const end = new Date(Date.parse(from)-86400000); return {from:new Date(+end-(days-1)*86400000).toISOString().slice(0,10),to:end.toISOString().slice(0,10)}; }
