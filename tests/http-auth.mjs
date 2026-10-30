import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

async function runServer(configured, port) {
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, DATABASE_URL: '', WORKSHOP_ADMIN_USER: configured ? 'test-owner' : '', WORKSHOP_ADMIN_PASSWORD: configured ? 'test-only-long-password-123' : '' },
  });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server startup timed out')), 10000);
      child.stdout.on('data', data => { if (data.toString().includes('Ready')) { clearTimeout(timeout); resolve(); } });
      child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited: ${code}`)); });
    });
    const get = (path, cookie) => fetch(origin + path, { redirect: 'manual', headers: cookie ? { cookie } : {} });
    const post = (path, body, requestOrigin = origin, cookie) => fetch(origin + path, { method: 'POST', redirect: 'manual', headers: { origin: requestOrigin, ...(cookie ? { cookie } : {}) }, body });
    for (const path of ['/', '/orders', '/orders/new', '/configuracion']) {
      const response = await get(path);
      assert.equal(response.status, 307, path);
      assert.equal(new URL(response.headers.get('location'), origin).pathname, '/login');
      assert.equal(response.headers.get('www-authenticate'), null);
    }
    for (const path of ['/catalogo', '/seguimiento', '/login']) assert.equal((await get(path)).status, 200, path);
    const page = await (await get('/login')).text();
    const form = (password = 'test-only-long-password-123') => new URLSearchParams({ username: 'test-owner', password });
    assert.equal((await post('/auth/login', form(), 'https://other.example')).status, 403);
    assert.equal((await post('/catalogo', form())).status, 401);
    if (!configured) {
      assert.match(page, /Falta activar el acceso/);
      assert.doesNotMatch(page, /name="password"/);
      const response = await post('/auth/login', form());
      assert.equal(response.status, 303);
      assert.match(response.headers.get('location'), /error=configuration/);
      console.log('PASS: missing setup produces a clear page without a browser password challenge');
      return;
    }
    assert.match(page, /name="password"/);
    const wrong = await post('/auth/login', form('wrong'));
    assert.equal(wrong.status, 303);
    assert.match(wrong.headers.get('location'), /error=credentials/);
    assert.equal(wrong.headers.get('set-cookie'), null);
    const response = await post('/auth/login', form());
    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), "/");
    const setCookie = response.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /Secure/i);
    assert.match(setCookie, /SameSite=lax/i);
    const cookie = setCookie.split(';')[0];
    assert.equal((await get('/orders/new', cookie)).status, 200);
    const dashboard = await get('/', cookie);
    assert.equal(dashboard.status, 307);
    assert.equal(new URL(dashboard.headers.get('location'), origin).pathname, '/configuracion');
    const setup = await get('/configuracion', cookie);
    assert.equal(setup.status, 200);
    assert.match(await setup.text(), /Tu acceso ya funciona/);
    const logout = await post('/auth/logout', form(), origin, cookie);
    assert.equal(logout.status, 303);
    assert.match(logout.headers.get('set-cookie'), /Max-Age=0/i);
    assert.equal((await get('/orders/new')).status, 307);
    console.log('PASS: login, wrong credentials, CSRF, signed session, missing database and logout');
  } finally {
    child.kill();
  }
}
await runServer(false, 3131);
await runServer(true, 3132);
