import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import serverlessChromium from '@sparticuz/chromium';
import { testDatabase } from './database';

async function main() {
  const db = await testDatabase();
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
  const server = spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3177'], { stdio:['ignore','pipe','pipe'], env:{...process.env,DATABASE_URL:db.url,VERCEL_ENV:'preview',APP_URL:origin,NEXT_PUBLIC_SUPABASE_URL:authOrigin,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_e2e',WORKSHOP_ADMIN_EMAIL:adminEmail} });
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
    await page.goto(origin);await expect(page.getByRole('heading',{name:'El taller, bajo control.'})).toBeVisible();
    await db.pg.exec("UPDATE public.omnifix_environment SET kind='production'");
    await page.goto(origin+'/orders/new');await expect(page.getByRole('heading',{name:'No pudimos completar la operación.'})).toBeVisible();await expect(page.getByRole('button',{name:'Guardar recepción'})).toHaveCount(0);
    await db.pg.exec("UPDATE public.omnifix_environment SET kind='preview'");
    await page.goto(origin+'/orders/new');
    await page.getByLabel('Nombre y apellido',{exact:true}).fill('Cliente Ficticio E2E');await page.getByLabel('Teléfono de contacto',{exact:true}).fill('0000000000');await page.getByLabel('Modelo',{exact:true}).fill('Control QA');await page.getByLabel('Marca',{exact:true}).fill('Marca QA');await page.getByLabel('IMEI / serie — privado',{exact:true}).fill('PRIVATE-SERIAL-E2E');await page.getByLabel('Falla declarada',{exact:true}).fill('No enciende.');await page.getByLabel('Nombre de quien acepta',{exact:true}).fill('Cliente Ficticio E2E');
    await page.getByLabel('Presupuesto para el cliente (ARS)',{exact:true}).fill('-3');await page.locator('input[name=accepted]').check();await page.getByRole('button',{name:'Guardar recepción'}).click();await expect(page.locator('.form-feedback.error')).toContainText('positivos');
    await expect(page.getByLabel('Nombre y apellido',{exact:true})).toHaveValue('Cliente Ficticio E2E');
    await page.getByLabel('Presupuesto para el cliente (ARS)',{exact:true}).fill('45000,50');await page.getByRole('button',{name:'Guardar recepción'}).click();await expect(page).toHaveURL(/\/orders\/[a-f0-9-]{36}$/);const orderUrl=page.url();const stale=await context.newPage();await stale.goto(orderUrl);
    await page.getByLabel('Estado nuevo',{exact:true}).selectOption('under_warranty');await page.getByRole('button',{name:'Guardar estado',exact:true}).click();await expect(page.locator('.form-feedback.success')).toContainText('Estado guardado');await expect(page.locator('.order-header .status')).toHaveText('En garantía');await page.reload();await expect(page.locator('.order-header .status')).toHaveText('En garantía');
    await stale.getByLabel('Estado nuevo',{exact:true}).selectOption('diagnosing');await stale.getByRole('button',{name:'Guardar estado',exact:true}).click();await expect(stale.locator('.form-feedback.error')).toContainText('La orden cambió');await expect(stale.locator('.form-feedback.success')).toHaveCount(0);await stale.reload();await expect(stale.locator('.order-header .status')).toHaveText('En garantía');await stale.close();
    const tokenUrl=await page.locator('.share-tracking input').inputValue();assert.ok(tokenUrl.startsWith(origin+'/seguimiento/'));
    await page.getByLabel('Diagnóstico privado',{exact:true}).fill('PRIVATE-DIAGNOSIS-E2E');await page.getByLabel('Mensaje público para el cliente',{exact:true}).fill('Estamos revisando tu control.');await page.getByRole('button',{name:'Guardar datos técnicos'}).click();await expect(page.locator('.form-feedback.success')).toContainText('guardados');await page.reload();await expect(page.getByLabel('Diagnóstico privado',{exact:true})).toHaveValue('PRIVATE-DIAGNOSIS-E2E');
    await page.getByLabel('Foto',{exact:true}).setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX2kAAAAASUVORK5CYII=','base64')});await page.getByLabel('Descripción',{exact:true}).fill('PRIVATE-PHOTO-E2E');await page.getByRole('button',{name:'Guardar foto privada'}).click();await expect(page.locator('.form-feedback.success')).toContainText('Foto guardada');await page.reload();const photoUrl=await page.getByRole('link',{name:'Ver foto privada'}).getAttribute('href');assert.ok(photoUrl);
    const pdf=await context.request.get(orderUrl+'/receipt.pdf');assert.equal(pdf.status(),200);assert.equal(pdf.headers()['content-type'],'application/pdf');await mkdir('tmp/e2e',{recursive:true});await writeFile('tmp/e2e/browser-intake.pdf',await pdf.body());
    const quote=await context.request.get(orderUrl+'/receipt.pdf?kind=quote');assert.equal(quote.status(),200);assert.equal(quote.headers()['content-type'],'application/pdf');await writeFile('tmp/e2e/browser-quote.pdf',await quote.body());assert.equal((await context.request.get(orderUrl+'/receipt.pdf?kind=unknown')).status(),400);
    const publicContext=await browser.newContext({viewport:{width:390,height:844}});const mobile=await publicContext.newPage();await mobile.goto(tokenUrl);await expect(mobile.locator('.status')).toHaveText('En garantía');await expect(mobile.getByText('Estamos revisando tu control.')).toBeVisible();const publicHtml=await mobile.content();for(const secret of ['PRIVATE-SERIAL','PRIVATE-DIAGNOSIS','PRIVATE-PHOTO','Cliente Ficticio','0000000000','45000']) assert.equal(publicHtml.includes(secret),false,secret);
    assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);await mobile.screenshot({path:'tmp/e2e/tracking-mobile.png',fullPage:true});
    const privatePhoto=await publicContext.request.get(origin+photoUrl,{maxRedirects:0});assert.equal(privatePhoto.status(),307);const privatePdf=await publicContext.request.get(orderUrl+'/receipt.pdf',{maxRedirects:0});assert.equal(privatePdf.status(),307);
    await page.goto(orderUrl);await page.getByText('Revocar enlace / QR',{exact:true}).click();await page.locator('input[name=confirmRotation]').check();await page.getByRole('button',{name:'Generar un enlace nuevo'}).click();await expect(page.locator('.form-feedback.success')).toContainText('Enlace reemplazado');await page.reload();const newTokenUrl=await page.locator('.share-tracking input').inputValue();assert.notEqual(newTokenUrl,tokenUrl);await mobile.goto(tokenUrl);await expect(mobile.getByRole('heading')).toContainText(/No encontramos/);await mobile.goto(newTokenUrl);await expect(mobile.locator('.status')).toHaveText('En garantía');
    const downloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:'Presupuesto',exact:true}).click();const download=await downloadPromise;assert.match(download.suggestedFilename(),/^OmniFix-.*-quote.pdf$/);await download.saveAs('tmp/e2e/desktop-downloaded-quote.pdf');
    await page.screenshot({path:'tmp/e2e/order-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});const mobileDownloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:'Orden A4',exact:true}).click();const mobileDownload=await mobileDownloadPromise;await mobileDownload.saveAs('tmp/e2e/mobile-downloaded-intake.pdf');await page.goto(origin+'/orders/new');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);await page.screenshot({path:'tmp/e2e/intake-mobile.png',fullPage:true});
    await page.goto(origin+'/orders');await page.getByRole('link',{name:'En garantía',exact:true}).click();await expect(page.locator('tbody .status')).toHaveText('En garantía');
    await page.locator('.mobile-nav').getByRole('button',{name:'Salir'}).click();await expect(page).toHaveURL(/\/login$/);await page.goto(orderUrl);await expect(page).toHaveURL(/\/login$/);
    await context.addCookies([{name:'sb-127-auth-token',value:authCookie,url:origin,sameSite:'Lax'}]);await page.goto(orderUrl);await expect(page.locator('.order-header .status')).toHaveText('En garantía');await page.reload();await expect(page.locator('.order-header .status')).toHaveText('En garantía');await expect(page.getByLabel('Diagnóstico privado',{exact:true})).toHaveValue('PRIVATE-DIAGNOSIS-E2E');
    assert.deepEqual(errors,[]);console.log('E2E PASS: real browser + isolated PostgreSQL; reception, validation, warranty persistence, public privacy/mobile, private photos/PDF, token rotation, filters and logout.');
  } catch(error) { console.error('E2E original error:',error);console.error(logs.slice(-3000));try{if(debugPage&&!debugPage.isClosed()){await mkdir('tmp/e2e',{recursive:true});await debugPage.screenshot({path:'tmp/e2e/failure.png',fullPage:true});console.error('URL',debugPage.url(),(await debugPage.locator('body').innerText()).slice(-5000));}}catch{}throw error; }
  finally { await browser?.close();server.kill();authServer.close();await db.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1});
