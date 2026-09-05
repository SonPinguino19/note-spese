import {test,expect} from '@playwright/test';
import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';

const year=new Date().getFullYear();
let errors;
test.beforeEach(async({page})=>{errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');});
test.afterEach(()=>expect(errors,'Nessun errore JavaScript non gestito').toEqual([]));
const go=async(page,name)=>page.getByRole('navigation').getByRole('button',{name,exact:true}).click();
async function add(page,{description='Acquisto di prova',amount='42,50',kind='expense'}={}){
 await go(page,'Aggiungi');
 await page.getByLabel('Data',{exact:true}).fill(`${year}-01-15`);
 await page.getByLabel('Descrizione',{exact:true}).fill(description);
 await page.getByLabel('Importo €',{exact:true}).fill(amount);
 await page.getByLabel('Tipo',{exact:true}).selectOption(kind);
 await page.getByRole('button',{name:'Salva movimento',exact:true}).click();
 await expect(page.getByRole('status')).toHaveText('Movimento salvato');
}
async function excelFixture(){
 const workbook=new ExcelJS.Workbook(),sheet=workbook.addWorksheet('Movimenti');
 sheet.addRow(['Persona','Mese','Data','Banca','Descrizione','Importo','Voce Spesa','Spesa per la coppia']);
 sheet.addRow(['Sofi',1,`12/01/${year}`,'Conto test','Acquisto importato','-12,50','Spesa','Si']);
 sheet.addRow(['Sofi',1,`12/01/${year}`,'Conto test','Acquisto importato','-12,50','Spesa','Si']);
 sheet.addRow(['Sofi',1,`31/02/${year}`,'Conto test','Data impossibile',-10,'Spesa','No']);
 sheet.getCell('J8').value='Totale riepilogo laterale';
 return {name:'movimenti-sintetici.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(await workbook.xlsx.writeBuffer())};
}
test('dashboard e filtri concordano con i movimenti',async({page},info)=>{
 await expect(page.getByRole('heading',{name:'Metriche',exact:true})).toBeVisible();
 await expect(page.locator('article').filter({hasText:'Spese nette'})).toContainText('800,00');
 await expect(page.locator('article').filter({hasText:'Risparmio'})).toContainText('1.400,00');
 await page.getByLabel('Dal',{exact:true}).fill(`${year}-01-05`);
 await page.getByLabel('Al',{exact:true}).fill(`${year}-01-05`);
 await expect(page.locator('article').filter({hasText:'Entrate'})).toContainText('0,00');
 await expect(page.getByText('Non disponibile',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:/Affitto.*800,00/}).click();
 await expect(page.getByRole('heading',{name:'Movimenti',exact:true})).toBeVisible();
 await expect(page.locator('tbody tr')).toHaveCount(1);
 await go(page,'Metriche');
 await info.attach('dashboard',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});
test('date cancellate e intervalli invertiti non bloccano la pagina',async({page})=>{
 await page.getByLabel('Dal',{exact:true}).fill('');
 await expect(page.getByRole('heading',{name:'Metriche',exact:true})).toBeVisible();
 await page.getByLabel('Dal',{exact:true}).fill(`${year+1}-01-01`);
 await expect(page.getByRole('heading',{name:'Metriche',exact:true})).toBeVisible();
 await page.getByLabel('Anno',{exact:true}).selectOption(String(year));
 await expect(page.locator('article').filter({hasText:'Spese nette'})).toContainText('800,00');
});
test('registrazione, rimborso e trasferimento aggiornano correttamente le metriche',async({page})=>{
 await add(page);
 await add(page,{description:'Rimborso di prova',amount:'10,00',kind:'refund'});
 await add(page,{description:'Trasferimento di prova',amount:'500',kind:'transfer'});
 await go(page,'Metriche');
 await expect(page.locator('article').filter({hasText:'Spese nette'})).toContainText('832,50');
 await expect(page.locator('article').filter({hasText:'Entrate'})).toContainText('2.200,00');
 await go(page,'Movimenti');
 const row=page.getByRole('row').filter({hasText:'Acquisto di prova'});
 page.once('dialog',dialog=>dialog.accept());await row.getByRole('button',{name:'Elimina'}).click();
 await expect(row).toHaveCount(0);
});
test('importazione reale xlsx, duplicati, righe errate e annullamento lotto',async({page})=>{
 const file=await excelFixture();await go(page,'Importa');
 await page.getByLabel('File Excel',{exact:true}).setInputFiles(file);
 await page.getByRole('button',{name:'Prepara anteprima'}).click();
 await expect(page.getByRole('heading',{name:'2 righe valide · 1 da correggere'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Conferma 1 movimenti'})).toBeEnabled();
 await page.getByRole('button',{name:'Conferma 1 movimenti'}).click();
 await expect(page.getByRole('status')).toHaveText('Importazione completata');
 await page.getByLabel('File Excel',{exact:true}).setInputFiles(file);
 await page.getByRole('button',{name:'Prepara anteprima'}).click();
 await expect(page.getByRole('button',{name:'Conferma 0 movimenti'})).toBeDisabled();
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:/Annulla lotto 1/}).click();
 await go(page,'Movimenti');await expect(page.locator('tbody tr')).toHaveCount(2);
});
test('file corrotto mostra errore senza bloccare navigazione',async({page})=>{
 await go(page,'Importa');await page.getByLabel('File Excel').setInputFiles({name:'corrotto.xlsx',mimeType:'application/octet-stream',buffer:Buffer.from('not an xlsx')});
 await expect(page.getByRole('status')).not.toBeEmpty();await go(page,'Metriche');
 await expect(page.getByRole('heading',{name:'Metriche',exact:true})).toBeVisible();
});
test('backup scaricabile e dati demo esplicitamente temporanei',async({page})=>{
 await add(page);await go(page,'Movimenti');
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Esporta tutti i dati JSON'}).click();
 const download=await pending;const content=JSON.parse(await fs.readFile(await download.path(),'utf8'));
 expect(content.find(r=>r.description==='Acquisto di prova').amount).toBe(-4250);
 await page.reload();await expect(page.getByText(/Modalità dimostrativa:/)).toBeVisible();
 await go(page,'Movimenti');await expect(page.locator('tbody tr')).toHaveCount(2);
});
test('controlli accessibili e pagina senza overflow orizzontale',async({page})=>{
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 await page.getByLabel('Dal',{exact:true}).focus();await page.keyboard.press('Tab');
 await expect(page.getByLabel('Al',{exact:true})).toBeFocused();
 await go(page,'Aggiungi');await expect(page.getByRole('button',{name:'Salva movimento'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
});
