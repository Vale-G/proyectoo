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
  for(const [customerName,model,status] of [['Cliente QA Uno','Motorola G23','repairing'],['Cliente QA Dos','PS4 Slim','awaiting_approval'],['Cliente QA Tres','Notebook QA','diagnosing'],['Cliente QA Cuatro','Samsung A14','ready_for_pickup']]){
    const order=await store.createOrder('20000000-0000-4000-8000-000000000001',fixture({customerName,model}));
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
    await page.goto(origin);await expect(page.getByRole('heading',{name:'Inicio',exact:true})).toBeVisible();
    await mkdir('tmp/design',{recursive:true});
    for(const theme of ['dark','light']){
      await page.setViewportSize({width:1280,height:900});
      await page.getByRole('button',{name:theme==='dark'?'Oscuro':'Claro'}).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
      assert.equal((await context.cookies()).find(c=>c.name==='workshop_appearance')?.httpOnly,true);
      const contrast=await page.evaluate(`(()=>{
        function luminance(value){
          const c=(value.match(/[0-9.]+/g)??[]).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
          return c[0]*.2126+c[1]*.7152+c[2]*.0722;
        }
        const tokens=getComputedStyle(document.documentElement);
        const heading=getComputedStyle(document.querySelector('h1'));
        // Canvas is the inherited background behind the main heading.
        const canvas=document.createElement('span');
        canvas.style.color=tokens.getPropertyValue('--color-canvas');
        document.body.appendChild(canvas);
        const bg=luminance(getComputedStyle(canvas).color);canvas.remove();
        const fg=luminance(heading.color);
        return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);
      })()`);
      assert.ok(Number(contrast)>=4.5,'Heading contrast');
      await page.screenshot({path:'tmp/design/after-'+theme+'-desktop.png',fullPage:true});
      await page.setViewportSize({width:390,height:844});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
      await page.screenshot({path:'tmp/design/after-'+theme+'-mobile.png',fullPage:true});
      await page.getByText('Menú',{exact:true}).click();
      await expect(page.getByRole('navigation',{name:'Navegación del taller'}).last()).toBeVisible();
      await page.getByText('Menú',{exact:true}).click();
    }
  } catch(error) { console.error('E2E original error:',error);console.error(logs.slice(-3000));try{if(debugPage&&!debugPage.isClosed()){await mkdir('tmp/e2e',{recursive:true});await debugPage.screenshot({path:'tmp/e2e/failure.png',fullPage:true});console.error('URL',debugPage.url(),(await debugPage.locator('body').innerText()).slice(-5000));}}catch{}throw error; }
  finally { await browser?.close();server.kill();authServer.close();await db.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1});
