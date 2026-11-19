import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {PDFDocument} from 'pdf-lib';
import {PNG} from 'pngjs';
import jsQR from 'jsqr';
import {eq} from 'drizzle-orm';
import {testDatabase} from './database';
import {fixture} from './fixture';
import {workshops,repairOrders} from '../src/db/schema';
import {repairStore} from '../src/lib/repair-store';
import {categoryChecks} from '../src/lib/repair-checks';
import {buildCycleReceipt,buildIntakeLayout,cycleSections} from '../src/lib/receipt';

test('repair cycle preserves intake, enforces tenant locations and saves audited final results',async()=>{
 const db=await testDatabase();try{
 const [a,b]=await db.database.insert(workshops).values([{name:'Laboratorio QA',publicName:'Laboratorio QA'},{name:'Otro QA',publicName:'Otro QA'}]).returning();
 const store=repairStore(db.database),order=await store.createOrder(a.id,fixture());
 const [location]=await store.createLocation(a.id,'Bandeja A1');const [foreign]=await store.createLocation(b.id,'Estante B2');
 assert.deepEqual(await store.listLocations(a.id),[location]);
 await assert.rejects(store.saveCycle(b.id,order.id,0,{locationId:foreign.id}));
 await assert.rejects(store.saveCycle(a.id,order.id,0,{locationId:foreign.id}));
 await assert.rejects(db.database.update(repairOrders).set({locationId:foreign.id}).where(eq(repairOrders.id,order.id)));
 await store.saveCycle(a.id,order.id,0,{locationId:location.id});
 const keys=categoryChecks(order.intakeData?'Celular / Tablet':'');
 const finalTests={recordedAt:new Date().toISOString(),items:Object.fromEntries(keys.map(key=>[key,{result:'passed',reason:''}]))};
 await assert.rejects(store.saveCycle(a.id,order.id,0,{finalTests}));
 await assert.rejects(store.saveCycle(a.id,order.id,1,{finalTests:{...finalTests,items:{}}}));
 await assert.rejects(store.saveCycle(a.id,order.id,1,{finalTests:{...finalTests,items:Object.fromEntries(keys.map(key=>[key,{result:'not_tested',reason:''}]))}}));
 // Two independent connections contend on the same revision under native PostgreSQL.
 if(db.native){const other=repairStore(db.connect().database);const results=await Promise.allSettled([store.saveCycle(a.id,order.id,1,{finalTests}),other.saveCycle(a.id,order.id,1,{finalTests})]);assert.equal(results.filter(item=>item.status==='fulfilled').length,1);}else await store.saveCycle(a.id,order.id,1,{finalTests});
 let fresh=(await store.getOrder(a.id,order.id))!;assert.deepEqual(fresh.intakeData,order.intakeData);assert.equal(fresh.locationName,'Bandeja A1');assert.equal(fresh.finalTests?.items.power.result,'passed');assert.ok(fresh.events.some(event=>event.note?.includes('final_tests')));assert.ok(fresh.events.some(event=>event.note?.includes('Bandeja A1')));
 const publicView=JSON.stringify(await store.getPublicOrder(order.publicToken));for(const key of ['finalTests','locationName','Bandeja A1','PRIVATE-IMEI'])assert.equal(publicView.includes(key),false);
 await db.database.update(repairOrders).set({publicSummary:'Diagnóstico público: conector dañado.',estimateCents:'9900000',diagnosis:'PRIVATE-DIAGNOSIS',partsDescription:'PRIVATE-SUPPLIER',deliveredAt:new Date(),deliveredTo:'Cliente QA',status:'delivered',proposedSolution:'Reemplazo del conector y prueba de carga.'}).where(eq(repairOrders.id,order.id));
 await assert.rejects(store.saveCycle(a.id,order.id,2,{finalTests}));fresh=(await store.getOrder(a.id,order.id))!;
 await mkdir('tmp/pdfs',{recursive:true});
 for(const layout of ['a4','a5','double'] as const){const pdf=await buildCycleReceipt(fresh,'https://qa.example',layout);await writeFile(`tmp/pdfs/cycle-${layout}.pdf`,pdf.bytes);const parsed=await PDFDocument.load(pdf.bytes);assert.ok(parsed.getPageCount()>=1);const text=execFileSync('pdftotext',[`tmp/pdfs/cycle-${layout}.pdf`,'-'],{encoding:'utf8'});assert.match(text,/45\.000,50/);assert.match(text,/99\.000/);for(const value of ['Recepción original','Diagnóstico público: conector dañado.','Pruebas finales','Cierre y entrega','Laboratorio QA'])assert.ok(text.includes(value),value);for(const value of ['PRIVATE-IMEI','PRIVATE-LINE','PRIVATE-DIAGNOSIS','PRIVATE-SUPPLIER','Bandeja A1'])assert.equal(text.includes(value),false,value);}
 const mainPdf=await PDFDocument.load(await readFile('tmp/pdfs/cycle-a4.pdf'));assert.equal(mainPdf.getPageCount(),1,'Representative full cycle should fit one A4');
 execFileSync('pdftoppm',['-scale-to','1600','-singlefile','-png','tmp/pdfs/cycle-a4.pdf','tmp/pdfs/cycle-a4']);const mainImage=PNG.sync.read(await readFile('tmp/pdfs/cycle-a4.png'));assert.equal(jsQR(new Uint8ClampedArray(mainImage.data),mainImage.width,mainImage.height)?.data,`https://qa.example/seguimiento/${fresh.publicToken}`);
 assert.ok(cycleSections(fresh).find(([title])=>title==='Pruebas iniciales')![1].includes('No realizada'));
 const label=await buildIntakeLayout(fresh,'https://qa.example','label');assert.equal(label.url,`https://qa.example/orders/${order.id}`);assert.equal(label.url.includes(order.publicToken),false);await writeFile('tmp/pdfs/admin-label.pdf',label.bytes);
 const labelText=execFileSync('pdftotext',['tmp/pdfs/admin-label.pdf','-'],{encoding:'utf8'});assert.match(labelText,/Laboratorio QA/);assert.match(labelText,/Bandeja A1/);assert.match(labelText,/Entregado/);assert.equal(labelText.includes(fresh.customerName),false);
 execFileSync('pdftoppm',['-scale-to','1600','-singlefile','-png','tmp/pdfs/admin-label.pdf','tmp/pdfs/admin-label']);const image=PNG.sync.read(await readFile('tmp/pdfs/admin-label.png'));const qr=jsQR(new Uint8ClampedArray(image.data),image.width,image.height);assert.equal(qr?.data,label.url);
 // Long content is retained on all layouts, not clipped or discarded after page one.
 const long={...fresh,reportedIssue:'Falla extensa. '.repeat(400)+'END-RECEPTION'};for(const layout of ['a4','a5','double'] as const){const result=await buildCycleReceipt(long,'https://qa.example',layout);const path=`tmp/pdfs/overflow-${layout}.pdf`;await writeFile(path,result.bytes);const parsed=await PDFDocument.load(result.bytes);assert.ok(parsed.getPageCount()>1);assert.match(execFileSync('pdftotext',[path,'-'],{encoding:'utf8'}),/END-RECEPTION/);}
 }finally{await db.close()}
});
test('category checklists distinguish computers, consoles and controllers',()=>{assert.ok(categoryChecks('Notebook / PC').includes('storage'));assert.ok(categoryChecks('Joystick').includes('sticks'));assert.equal(categoryChecks('Joystick').includes('disc'),false);assert.ok(categoryChecks('Consola / Joystick').includes('sticks'));assert.ok(categoryChecks('Consola / Joystick','PS4').includes('disc'));assert.ok(categoryChecks('Celular / Tablet').includes('touch'));});
