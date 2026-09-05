import ExcelJS from 'exceljs';
import {cents,validate} from './domain.js';
export async function readExcel(file){
 if(file.size>15*1024*1024)throw Error('Dimensione massima: 15 MB');
 const book=new ExcelJS.Workbook();await book.xlsx.load(await file.arrayBuffer());
 return book.worksheets.map(s=>({name:s.name,rows:Array.from(s.getSheetValues().slice(1),r=>Array.from((r||[]).slice(1),v=>v&&typeof v==='object'&&!(v instanceof Date)?v.result??v.text??'':v))}));
}
export function convert(rows,map,defaults){const result=[],errors=[];rows.slice(1).forEach((row,i)=>{if(!row||!row.some(v=>v!==undefined&&v!==null&&v!==''))return;if(!Object.values(map).some(column=>column>=0&&row[column]!==undefined&&row[column]!==null&&row[column]!==''))return;try{
 let date=row[map.date];if(date instanceof Date)date=date.toISOString().slice(0,10);else if(typeof date==='number')date=new Date(Date.UTC(1899,11,30)+date*86400000).toISOString().slice(0,10);else{date=String(date||'').trim();if(/^\d{2}\/\d{2}\/\d{4}$/.test(date))date=date.split('/').reverse().join('-');}
 const amount=cents(row[map.amount]);const category=String(row[map.category]||'Da classificare');const kind=category==='Investimenti'?'investment':category==='Saldi'?'opening':amount>0?'income':'expense';
 result.push(validate({id:crypto.randomUUID(),date,amount,description:String(row[map.description]||''),person:String(row[map.person]||defaults.person),account:String(row[map.account]||defaults.account),category,shared:/^(si|sì|true)$/i.test(String(row[map.shared]||'')),kind}));
 }catch(e){errors.push(`Riga ${i+2}: ${e.message}`);}});return {result,errors};}
