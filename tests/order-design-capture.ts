import {assertControlContrast} from './contrast';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import serverlessChromium from '@sparticuz/chromium';
import { repairStore } from '../src/lib/repair-store';
import { fixture } from './fixture';
import { testDatabase } from './database';

async function main() {
  const db = await testDatabase();
  await db.pg.exec("INSERT INTO workshops(id,name,public_name) VALUES('20000000-0000-4000-8000-000000000001','OmniFix','OmniFix'); INSERT INTO workshop_members(workshop_id,user_id,role) VALUES('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','owner')");
  const store=repairStore(db.database);
  let detailId="";
  for(const [customerName,model,status] of [['Cliente QA Uno','Motorola G23','repairing'],['Cliente QA Dos','PS4 Slim','awaiting_approval'],['Cliente QA Tres','Notebook QA','diagnosing'],['Cliente QA Cuatro','Samsung A14','ready_for_pickup']]){
    const order=await store.createOrder('20000000-0000-4000-8000-000000000001',fixture({customerName,model}));
    detailId=order.id;
    await db.pg.exec("UPDATE repair_orders SET status='"+status+"' WHERE id='"+order.id+"'");
  }
  const origin = 'http://127.0.0.1:3177';
  const authOrigin = 'http://127.0.0.1:3180';
  const adminEmail = 'qa-admin@example.com';
  const authServer = createServer((request,response) => {
    if (request.url === '/auth/v1/user') {
      response.writeHead(request.headers.authorization === 'Bearer e2e-access-token' ? 200 : 401, {'content-type':'application/json'});
      response.end(request.headers.authorization === 'Bearer e2e-access-token' ? JSON.stringify({id:'00000000-0000-4000-8000-000000000001',aud:'authenticated',role:'authenticated',email:adminEmail,email_confirmed_at:new Date(0).toISOString(),identities:[{provider:'google'}],app_metadata:{provider:'google',providers:['google']},user_metadata:{},created_at:new Date(0).toISOString()}) : JSON.stringify({message:'invalid token'}));
      return;
    }
    if (request.url?.startsWith('/auth/v1/logout')) { response.writeHead(204); response.end(); return; }
    response.writeHead(404, {'content-type':'application/json'});response.end('{}');
  });
  await new Promise<void>((resolve,reject)=>authServer.listen(3180,'127.0.0.1',resolve).once('error',reject));
  const server = spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3177'], { stdio:['ignore','pipe','pipe'], env:{...process.env,DATABASE_URL:db.url,VERCEL_ENV:'preview',APP_URL:origin,NEXT_PUBLIC_SUPABASE_URL:authOrigin,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_e2e',WORKSHOP_ADMIN_EMAIL:'legacy-owner@example.com'} });
  let logs='';server.stderr.on('data',d=>logs+=d.toString());
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  let debugPage: import('@playwright/test').Page | undefined;
  try {
    await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Next startup timeout')),15000);server.stdout.on('data',d=>{if(d.toString().includes('Ready')){clearTimeout(timer);resolve()}});server.once('exit',code=>{clearTimeout(timer);reject(new Error(`Next exited ${code}: ${logs}`))})});
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH ?? '/tmp/omnifix-chromium/chromium', args: serverlessChromium.args.filter(arg => arg !== '--single-process'), headless:true });
    const context=await browser.newContext({viewport:{width:1280,height:900}});
    const page=await context.newPage();debugPage=page;page.setDefaultTimeout(10000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/orders');await expect(page).toHaveURL(/\/login$/);
    const session={access_token:'e2e-access-token',refresh_token:'e2e-refresh-token',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:'00000000-0000-4000-8000-000000000001',aud:'authenticated',role:'authenticated',email:adminEmail,app_metadata:{provider:'google'},user_metadata:{}}};
    const authCookie='base64-'+Buffer.from(JSON.stringify(session)).toString('base64url');
    await context.addCookies([{name:'sb-127-auth-token',value:authCookie,url:origin,sameSite:'Lax'}]);
    await mkdir('tmp/orders-design',{recursive:true});
    for(const theme of ['dark','light']){
      await page.setViewportSize({width:1280,height:900});
      await page.goto(origin);
      await page.getByRole('button',{name:theme==='dark'?'Oscuro':'Claro'}).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
      for(const [screen,path] of [['list','/orders'],['detail','/orders/'+detailId+'?tab=recepcion'],['intake','/orders/new']]){
        await page.setViewportSize({width:1280,height:900});
        await page.goto(origin+path);
        if(screen==='intake'){
          await page.getByLabel('Nombre y apellido',{exact:true}).fill('Cliente de recepción QA');
          await page.getByLabel('Teléfono de contacto',{exact:true}).fill('0000000000');
          await page.getByLabel('Modelo',{exact:true}).fill('Equipo sintético');
          await page.getByRole('button',{name:'Continuar →'}).click();
          await expect(page.getByLabel('Falla declarada',{exact:true})).toBeVisible();
          await page.getByRole('button',{name:'Anterior',exact:true}).click();
          await expect(page.getByLabel('Modelo',{exact:true})).toHaveValue('Equipo sintético');
          await page.getByRole('button',{name:'Continuar →'}).click();
          await page.getByLabel('Método de desbloqueo',{exact:true}).selectOption('pattern');
          await expect(page.locator('input[name=pin],input[name=password],input[name=pattern]')).toHaveCount(0);
        }
        if(screen==='detail'){
          await page.getByRole('link',{name:'Diagnóstico',exact:true}).click();
          await expect(page.getByLabel('Diagnóstico privado',{exact:true})).toBeVisible();
        }
        for(const [device,width,height] of [['desktop',1280,900],['mobile',390,844]] as const){
          await page.setViewportSize({width,height});
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,screen+' overflow');
          await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement) document.activeElement.blur();window.scrollTo(0,0)});
          await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
          await assertControlContrast(page);
          if(screen==='list' && theme==='dark' && device==='mobile'){
            const chip=page.locator('.filters a').last();await chip.evaluate(el=>{el.setAttribute('style','background:#fff;color:#fff')});
            await assert.rejects(assertControlContrast(page),/contrast/);await chip.evaluate(el=>el.removeAttribute('style'));await assertControlContrast(page);
          }
          await page.screenshot({path:'tmp/orders-design/'+screen+'-'+theme+'-'+device+'.png',fullPage:false});
        }
      }
    }
    await page.goto(origin+'/orders/'+detailId+'?tab=pruebas');
    await page.getByText('Ubicación física · Sin asignar',{exact:true}).click();
    await page.getByLabel('Nueva ubicación del taller',{exact:true}).fill('Bandeja A1');
    await page.getByRole('button',{name:'Crear ubicación',exact:true}).click();
    await expect(page.getByRole('status').filter({hasText:'Ubicación disponible'})).toBeVisible();
    await page.getByLabel('Ubicación',{exact:true}).selectOption({label:'Bandeja A1'});
    await page.getByRole('button',{name:'Guardar ubicación',exact:true}).click();
    await expect(page.getByRole('status').filter({hasText:'Ubicación guardada'})).toBeVisible();
    await page.reload();await expect(page.getByText('Ubicación física · Bandeja A1',{exact:true})).toBeVisible();
    for(const select of await page.locator('select[name^=final_]').all()) await select.selectOption('passed');
    await page.locator('select[name=final_power]').selectOption('not_tested');
    await page.getByRole('button',{name:'Guardar pruebas finales',exact:true}).click();
    await expect(page.getByRole('alert').filter({hasText:'Revisá los resultados finales'})).toBeVisible();await assertControlContrast(page);
    await page.locator('select[name=final_power]').selectOption('passed');
    await page.getByRole('button',{name:'Guardar pruebas finales',exact:true}).click();
    await expect(page.getByRole('status')).toContainText('Pruebas finales guardadas');
    await page.reload();await expect(page.locator('select[name=final_power]')).toHaveValue('passed');
    for(const theme of ['dark','light']){
      await context.addCookies([{name:'workshop_appearance',value:theme,url:origin}]);await page.reload();
      await assertControlContrast(page);
      await page.screenshot({path:'tmp/orders-design/final-tests-'+theme+'-mobile.png',fullPage:false});
    }
    await page.goto(origin+'/orders?q=QA+Dos&status=awaiting_approval');
    await expect(page.locator('.orders-mobile-list li')).toHaveCount(1);
    await expect(page.locator('.orders-mobile-list')).toContainText('Cliente QA Dos');
    assert.deepEqual(errors,[]);
    console.log('Orders UX PASS: theme captures, staged field retention, unlock metadata, tabs, responsive lists and combined filters.');
  } catch(error) { console.error('E2E original error:',error);console.error(logs.slice(-3000));try{if(debugPage&&!debugPage.isClosed()){await mkdir('tmp/e2e',{recursive:true});await debugPage.screenshot({path:'tmp/e2e/failure.png',fullPage:true});console.error('URL',debugPage.url(),(await debugPage.locator('body').innerText()).slice(-5000));}}catch{}throw error; }
  finally { await browser?.close();server.kill();authServer.close();await db.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1});
