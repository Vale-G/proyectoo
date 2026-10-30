import test from 'node:test';
import assert from 'node:assert/strict';
import { configuredAdmin, validCredentials, createSession, validSession, SESSION_SECONDS } from '../src/lib/auth-credentials.ts';
const config = { username: 'owner', password: 'test-only-long-password-123' };
test('accepts only configured credentials', () => {
  assert.equal(validCredentials(config.username, config.password, config), true);
  assert.equal(validCredentials('someone', config.password, config), false);
  assert.equal(validCredentials(config.username, 'incorrect', config), false);
  assert.equal(configuredAdmin({}), false);
  assert.equal(validCredentials('', '', {}), false);
  assert.equal(configuredAdmin({ username: 'owner', password: 'short' }), false);
});
test('session rejects forged, expired, malformed and rotated credentials', () => {
  const now = 100000000;
  const token = createSession(config, now);
  assert.equal(validSession(token, config, now), true);
  assert.equal(validSession(token, config, now + SESSION_SECONDS * 1000), false);
  assert.equal(validSession(token, { ...config, password: 'rotated-test-password-12345' }, now), false);
  for (const value of [undefined, 'bad', token + '.extra', token.slice(0, -1), 'x'.repeat(2000)]) assert.equal(validSession(value, config, now), false);
  const [payload, signature] = token.split('.');
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
  data.exp += 1000;
  const forged = `${Buffer.from(JSON.stringify(data)).toString('base64url')}.${signature}`;
  assert.equal(validSession(forged, config, now), false);
});
test('sessions are distinct and never contain the password', () => {
  const first = createSession(config);
  assert.notEqual(first, createSession(config));
  assert.equal(Buffer.from(first.split('.')[0], 'base64url').toString().includes(config.password), false);
});
