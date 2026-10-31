import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { assertDatabaseReady } from '../src/lib/database-readiness';
import { PDFDocument } from 'pdf-lib';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { repairStore } from '../src/lib/repair-store';
import { moneyToCents, validationMessage } from '../src/lib/intake';
import { formatMoney } from '../src/lib/format';
import { canTransition } from '../src/lib/status';
import { buildReceipt, receiptSections } from '../src/lib/receipt';
import { trackingUrl } from '../src/lib/tracking-url';
import { fixture } from './fixture';
import { testDatabase } from './database';

test('PostgreSQL integration using production postgres.js driver, no external database', async t => {
  const env = await testDatabase();
  const store = repairStore(env.database);
  const second = env.connect();
  // PGlite has one backend; use the application's one-connection queue locally.
  // CI MUST use distinct native backends (asserted below) for cross-instance contention.
  const otherStore = env.native ? repairStore(second.database) : store;
  try {
    await t.test('Preview refuses an unmarked or production-marked database before writes', async () => {
      await assertDatabaseReady(env.database, true);
      await env.pg.exec("DELETE FROM public.omnifix_environment");
      await assert.rejects(assertDatabaseReady(env.database,true), /Preview bloqueado/);
      await env.pg.exec("INSERT INTO public.omnifix_environment(id,kind) VALUES(true,'preview')");
      await env.pg.exec("UPDATE public.omnifix_environment SET kind='production'");
      await assert.rejects(assertDatabaseReady(env.database,true), /Preview bloqueado/);
      await env.pg.exec("UPDATE public.omnifix_environment SET kind='preview'");
    });
    await t.test('migration closes all seven tables to Supabase public roles', async () => {
      const result = await env.pg.query<{relname:string;relrowsecurity:boolean;anon_select:boolean;authenticated_select:boolean}>("select c.relname,c.relrowsecurity,has_table_privilege('anon',c.oid,'SELECT') as anon_select,has_table_privilege('authenticated',c.oid,'SELECT') as authenticated_select from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'");
      assert.deepEqual(result.rows.map(row=>row.relname).sort(), ['workshops','customers','devices','repair_orders','repair_order_events','repair_photos','omnifix_environment'].sort());
      for(const row of result.rows){assert.equal(row.relrowsecurity,true,row.relname);assert.equal(row.anon_select,false,row.relname);assert.equal(row.authenticated_select,false,row.relname);}
    });
    await t.test('native CI uses independent PostgreSQL backends for contention', { skip: !env.native }, async () => {
      if (!env.native) return;
      const one=await env.pg.query<{pid:number}>('select pg_backend_pid() as pid');
      const two=await second.client<{pid:number}[]>`select pg_backend_pid() as pid`;
      assert.notEqual(one.rows[0].pid,two[0].pid);
    });
    const workshop = await store.ensureWorkshop();
    const order = await store.createOrder(workshop.id, fixture());
    await t.test('received to warranty persists, survives reread and has matching history', async () => {
      assert.equal(canTransition('received','under_warranty'),true);
      const result = await store.changeStatus(workshop.id,order.id,0,'under_warranty','Ingreso para revisión de garantía');
      assert.equal(result.status,'under_warranty');
      const fresh = await store.getOrder(workshop.id,order.id);
      assert.equal(fresh!.status,'under_warranty');
      assert.equal(fresh!.events[0].toStatus,'under_warranty');
      assert.equal(fresh!.events.length,2);
    });
    await t.test('denied transition has no persisted side effects', async () => {
      await assert.rejects(store.changeStatus(workshop.id,order.id,1,'diagnosing',''), /no está permitido/);
      assert.equal((await store.getOrder(workshop.id,order.id))!.events.length,2);
    });
    await t.test('stale simultaneous changes produce exactly one successful mutation', async () => {
      const outcomes = await Promise.allSettled([store.changeStatus(workshop.id,order.id,1,'repairing','a'),otherStore.changeStatus(workshop.id,order.id,1,'repairing','b')]);
      assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1);
      const fresh = await store.getOrder(workshop.id,order.id);
      assert.equal(fresh!.revision,2); assert.equal(fresh!.events.length,3);
    });
    await t.test('history failure rolls back the status mutation', async () => {
      await env.pg.exec("CREATE FUNCTION reject_qa_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'QA injected history failure'; END $$; CREATE TRIGGER reject_qa BEFORE INSERT ON repair_order_events FOR EACH ROW EXECUTE FUNCTION reject_qa_event();");
      try { await assert.rejects(store.changeStatus(workshop.id,order.id,2,'awaiting_part','')); }
      finally { await env.pg.exec('DROP TRIGGER reject_qa ON repair_order_events; DROP FUNCTION reject_qa_event();'); }
      const fresh = await store.getOrder(workshop.id,order.id); assert.equal(fresh!.revision,2); assert.equal(fresh!.status,'repairing'); assert.equal(fresh!.events.length,3);
    });
    await t.test('concurrent receptions receive distinct monotonic numbers', async () => {
      const results = await Promise.all(Array.from({length:8},(_,i)=>(i % 2 ? store : otherStore).createOrder(workshop.id,fixture())));
      assert.equal(new Set(results.map(x=>x.orderNumber)).size,8);
      assert.deepEqual(results.map(x=>Number(x.orderNumber)).sort((a,b)=>a-b),[2,3,4,5,6,7,8,9]);
    });
    await t.test('invalid intake cannot insert any partial records', async () => {
      const before = await env.pg.query('select count(*) from customers');
      await assert.rejects(store.createOrder(workshop.id,fixture({accepted:false as true})));
      assert.deepEqual(await env.pg.query('select count(*) from customers'),before);
    });
    await t.test('private technical details never appear in public projection', async () => {
      await store.updateTechnical(workshop.id,order.id,2,{diagnosis:'PRIVATE-DIAGNOSIS',proposedSolution:'PRIVATE-SOLUTION',publicSummary:'Estamos revisando tu equipo.',partsCents:'1234567',laborCents:'345678',estimateCents:'9900000',paidCents:'300000',approvalReference:'PRIVATE-APPROVAL',warrantyUntil:null});
      const publicOrder = await store.getPublicOrder(order.publicToken);
      const value=JSON.stringify(publicOrder);
      for(const secret of ['PRIVATE-','Cliente Ficticio','0000000000','4500050','1234567','345678','consent','customer','diagnosis','intakeData','photos']) assert.equal(value.includes(secret),false,secret);
      assert.equal(publicOrder!.publicSummary,'Estamos revisando tu equipo.');
      assert.equal(await store.getPublicOrder(order.orderNumber),null);
      assert.equal(await store.getPublicOrder('x'.repeat(64)),null);
      assert.equal(await store.getOrder('00000000-0000-4000-8000-000000000000',order.id),null);
    });
    await t.test('private photos reject invalid types and foreign workshops', async () => {
      const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX2kAAAAASUVORK5CYII=','base64');
      const photo = await store.addPhoto(workshop.id,order.id,png,'image/png','PRIVATE-PHOTO');
      assert.ok(await store.getPhoto(workshop.id,order.id,photo.id));
      assert.equal(await store.getPhoto('00000000-0000-4000-8000-000000000000',order.id,photo.id),null);
      await assert.rejects(store.addPhoto(workshop.id,order.id,Buffer.from('<svg/>'),'image/svg+xml','malformed'));
      await assert.rejects(store.addPhoto(workshop.id,order.id,Buffer.alloc(3*1024*1024),'image/png','large'));
      for(let i=0;i<4;i++) await store.addPhoto(workshop.id,order.id,png,'image/png','PRIVATE-PHOTO');
      const competing = await Promise.allSettled([store.addPhoto(workshop.id,order.id,png,'image/png','a'),otherStore.addPhoto(workshop.id,order.id,png,'image/png','b')]);
      assert.equal(competing.filter(x=>x.status==='fulfilled').length,1);
      const fresh = await store.getOrder(workshop.id,order.id); assert.equal(fresh!.photos.length,6);assert.equal('content' in fresh!.photos[0],false);
    });
    await t.test('rotating tracking token revokes old links without changing state', async () => {
      const rotated=await store.rotateToken(workshop.id,order.id,3);
      assert.equal(await store.getPublicOrder(order.publicToken),null);
      assert.equal((await store.getPublicOrder(rotated.publicToken))!.status,'repairing');
      assert.notEqual(rotated.publicToken,order.publicToken);
    });
    await t.test('delivery requires recipient and creates a distinct delivery receipt', async () => {
      await store.changeStatus(workshop.id,order.id,4,'testing','Pruebas finales');
      await store.changeStatus(workshop.id,order.id,5,'ready_for_pickup','Listo');
      await assert.rejects(store.changeStatus(workshop.id,order.id,6,'delivered',''),/quién recibe/);
      await store.changeStatus(workshop.id,order.id,6,'delivered','Entrega confirmada',{recipient:'Titular QA',accessories:'Funda y cable USB'});
      const fresh=await store.getOrder(workshop.id,order.id);
      assert.ok(fresh!.deliveredAt);assert.equal(fresh!.deliveredTo,'Titular QA');
      assert.equal(receiptSections(fresh!,'intake').find(([key])=>key==='Estado de ingreso')![1],'Recibido');
    });
    await t.test('A4 PDFs have readable QR and exclude private fields', async () => {
      const fresh=(await store.getOrder(workshop.id,order.id))!;
      await mkdir('tmp/pdfs',{recursive:true});
      for(const kind of ['intake','delivery','quote'] as const) {
        const pdf=await buildReceipt(fresh,'https://omnifix.example',kind);
        const fs=await import('node:fs/promises');await fs.writeFile(`tmp/pdfs/${kind}.pdf`,pdf.bytes);
        const parsed=await PDFDocument.load(pdf.bytes);assert.ok(parsed.getPageCount()>=2);
        for(const page of parsed.getPages()) {assert.ok(Math.abs(page.getWidth()-595.28)<1);assert.ok(Math.abs(page.getHeight()-841.89)<1);}
        const text=execFileSync('pdftotext',[`tmp/pdfs/${kind}.pdf`,'-'],{encoding:'utf8'});
        for(const secret of ['PRIVATE-IMEI','PRIVATE-DIAGNOSIS','PRIVATE-APPROVAL','PRIVATE-PHOTO','PRIVATE-LINE','1234567']) assert.equal(text.includes(secret),false,secret);
        if(kind==='intake'){assert.match(text,/45\.000,50/);assert.equal(text.includes('99.000'),false);}else assert.match(text,/99\.000/);assert.equal(/12\.345,67|3\.456,78/.test(text),false);assert.match(text,/NO AUTORIZADO/);assert.match(text,/omnifix-2026-10-30-draft-1/);
        if(kind==='quote') {assert.match(text,/PRESUPUESTO/);assert.match(text,/No acredita aceptaci/);assert.match(text,/Total de presupuesto/);}
        execFileSync('pdftoppm',['-scale-to','1600','-png',`tmp/pdfs/${kind}.pdf`,`tmp/pdfs/${kind}`]);
        let decoded=false;
        for(const filename of (await fs.readdir('tmp/pdfs')).filter(x=>x.startsWith(kind+'-')&&x.endsWith('.png'))) {
          const image=PNG.sync.read(await readFile('tmp/pdfs/'+filename));const qr=jsQR(new Uint8ClampedArray(image.data),image.width,image.height);
          if(qr) {assert.equal(qr.data,trackingUrl(fresh.publicToken,'https://omnifix.example'));decoded=true;}
        }
        assert.equal(decoded,true,`QR unreadable in ${kind}`);
      }
    });
  } finally { await env.close(); }
});

test('money parser preserves cents and rejects negative and ambiguous values',()=>{
  assert.equal(moneyToCents('45000,50'),'4500050');assert.match(formatMoney('4500050'),/45\.000,50/);assert.equal(moneyToCents('0'),'0');assert.equal(moneyToCents(''),null);
  for(const value of ['-1','1.000.000','abc','10,999']) assert.throws(()=>moneyToCents(value));
  assert.equal(validationMessage(new Error('password=DO-NOT-LEAK')).includes('DO-NOT-LEAK'),false);
});
