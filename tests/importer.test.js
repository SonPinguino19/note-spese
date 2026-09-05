import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {readExcel,convert} from '../src/importer.js';
const map={date:2,description:4,amount:5,person:0,account:3,category:6,shared:7};
const defaults={person:'Peng',account:'Conto'};
test('file Excel con date, vuoti e riepiloghi laterali',async()=>{
 const w=new ExcelJS.Workbook(),s=w.addWorksheet('2026');
 s.addRow(['Persona','Mese','Data','Banca','Descrizione','Importo','Voce Spesa','Spesa per la coppia']);
 s.addRow(['Peng',1,new Date('2026-01-12T00:00:00Z'),'Conto','Negozio','-12,50','Spesa','Si']);
 s.getCell('J4').value='Riepilogo non da importare';
 const bytes=await w.xlsx.writeBuffer();const [sheet]=await readExcel({size:bytes.length,arrayBuffer:async()=>bytes});
 const p=convert(sheet.rows,map,defaults);assert.equal(p.result.length,1);assert.equal(p.errors.length,0);assert.equal(p.result[0].date,'2026-01-12');assert.equal(p.result[0].amount,-1250);assert.equal(p.result[0].shared,true);
});
test('date impossibili e importi invalidi sono esclusi, non convertiti in zeri',()=>{
 const p=convert([[],['Peng',1,'31/02/2026','Conto','Errore',-12],['Peng',1,'12/01/2026','Conto','Errore','abc']],map,defaults);assert.equal(p.result.length,0);assert.equal(p.errors.length,2);
});
