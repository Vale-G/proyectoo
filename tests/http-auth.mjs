import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';

async function startNext(port, env = {}) {
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, DATABASE_URL: '', ...env } });
  await new Promise((resolve, reject) => { const timeout = setTimeout(() => reject(new Error('Server startup timed out')), 10000); child.stdout.on('data', data => { if (data.toString().includes('Ready')) { clearTimeout(timeout); resolve(); } }); child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited: ${code}`)); }); });
  return child;
}

const publicOrigin = 'https://omnifix-preview.example';
const adminEmail = 'admin@example.com';
const usedCodes = new Set();
const authServer = createServer(async (request, response) => {
  if (request.url?.startsWith('/auth/v1/token')) {
    let body = ''; for await (const chunk of request) body += chunk;
    const contentType = request.headers['content-type'] ?? '';
    const code = contentType.includes('application/json') ? JSON.parse(body).auth_code : new URLSearchParams(body).get('auth_code');
    if (!code || usedCodes.has(code)) { response.writeHead(400, {'content-type':'application/json'}); response.end(JSON.stringify({error:'invalid_grant'})); return; }
    usedCodes.add(code);
    const access_token = code === 'other-account' ? 'other-token' : 'admin-token';
    response.writeHead(200, {'content-type':'application/json'}); response.end(JSON.stringify({access_token,refresh_token:'refresh-token',expires_in:3600,token_type:'bearer',user:{id:'1',email:code === 'other-account' ? 'other@example.com' : adminEmail}})); return;
  }
  if (request.url === '/auth/v1/user') {
    const email = request.headers.authorization === 'Bearer other-token' ? 'other@example.com' : adminEmail;
    response.writeHead(200, {'content-type':'application/json'}); response.end(JSON.stringify({id:'1',email,email_confirmed_at:'2026-11-06T00:00:00Z',identities:[{provider:'google'}],app_metadata:{providers:['google']},user_metadata:{}})); return;
  }
  if (request.url?.startsWith('/auth/v1/logout')) { response.writeHead(204); response.end(); return; }
  response.writeHead(404, {'content-type':'application/json'}); response.end('{}');
});
await new Promise((resolve,reject)=>authServer.listen(3130,'127.0.0.1',resolve).once('error',reject));

const unconfigured = await startNext(3131, { NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '', WORKSHOP_ADMIN_EMAIL: '', APP_URL: 'http://127.0.0.1:3131' });
try {
  const origin = 'http://127.0.0.1:3131';
  const get = path => fetch(origin + path, { redirect: 'manual' });
  const post = (path, requestOrigin = origin) => fetch(origin + path, { method: 'POST', redirect: 'manual', headers: { origin: requestOrigin } });
  for (const path of ['/', '/orders', '/orders/new', '/configuracion']) assert.equal((await get(path)).status, 307, path);
  assert.match(await (await get('/login')).text(), /Falta activar el acceso con Google/);
  assert.equal((await post('/auth/google', 'https://other.example')).status, 403);
  assert.match((await post('/auth/google')).headers.get('location'), /error=configuration/);
  assert.match((await get('/auth/callback?code=x')).headers.get('location'), /error=configuration/);
} finally { unconfigured.kill(); }

const configured = await startNext(3132, { NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:3130', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', WORKSHOP_ADMIN_EMAIL: adminEmail, APP_URL: publicOrigin });
try {
  const origin = 'http://127.0.0.1:3132';
  const login = await fetch(origin + '/auth/google', { method:'POST', redirect:'manual', headers:{origin} });
  assert.equal(login.status, 303);
  const authorize = new URL(login.headers.get('location'));
  assert.equal(authorize.origin, 'http://127.0.0.1:3130');
  assert.equal(authorize.searchParams.get('provider'), 'google');
  assert.equal(authorize.searchParams.get('redirect_to'), publicOrigin + '/auth/callback');
  assert.ok(authorize.searchParams.get('code_challenge'));
  const verifierCookie = login.headers.get('set-cookie').split(';')[0];
  assert.match(login.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(login.headers.get('set-cookie'), /Secure/i);
  const callback = code => fetch(origin + `/auth/callback?code=${code}`, { redirect:'manual', headers:{cookie:verifierCookie} });
  const success = await callback('good-code');
  assert.equal(success.status, 303); assert.equal(success.headers.get('location'), publicOrigin + '/');
  const replay = await callback('good-code');
  assert.match(replay.headers.get('location'), /error=callback/);
  const denied = await callback('other-account');
  assert.match(denied.headers.get('location'), /error=unauthorized/);
  console.log('PASS: Google PKCE initiation, canonical callback, secure cookie, exchange, replay rejection and unauthorized account');
} finally { configured.kill(); authServer.close(); }
