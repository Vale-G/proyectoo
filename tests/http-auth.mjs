import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const port = 3131;
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, DATABASE_URL: '', NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '', WORKSHOP_ADMIN_EMAIL: '' },
});
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server startup timed out')), 10000);
    child.stdout.on('data', data => { if (data.toString().includes('Ready')) { clearTimeout(timeout); resolve(); } });
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited: ${code}`)); });
  });
  const get = path => fetch(origin + path, { redirect: 'manual' });
  const post = (path, requestOrigin = origin) => fetch(origin + path, { method: 'POST', redirect: 'manual', headers: { origin: requestOrigin } });
  for (const path of ['/', '/orders', '/orders/new', '/configuracion']) {
    const response = await get(path);
    assert.equal(response.status, 307, path);
    assert.equal(new URL(response.headers.get('location'), origin).pathname, '/login');
  }
  for (const path of ['/catalogo', '/seguimiento', '/login']) assert.equal((await get(path)).status, 200, path);
  const page = await (await get('/login')).text();
  assert.match(page, /Falta activar el acceso con Google/);
  assert.doesNotMatch(page, /name="password"/);
  assert.equal((await post('/auth/google', 'https://other.example')).status, 403);
  const response = await post('/auth/google');
  assert.equal(response.status, 303);
  assert.match(response.headers.get('location'), /error=configuration/);
  assert.equal((await post('/catalogo')).status, 401);
  console.log('PASS: closed-by-default Google auth setup, public routes and CSRF protection');
} finally {
  child.kill();
}
