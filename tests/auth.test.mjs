import test from 'node:test';
import assert from 'node:assert/strict';
import { validWorkshopCredentials } from '../src/lib/auth-credentials.ts';
const user = 'owner';
const password = 'test-only-long-password-123';
const header = value => `Basic ${Buffer.from(value).toString('base64')}`;
test('accepts matching credentials', () => assert.equal(validWorkshopCredentials(header(`${user}:${password}`), user, password), true));
test('rejects missing configuration and short passwords', () => {
  assert.equal(validWorkshopCredentials(header(':'), '', ''), false);
  assert.equal(validWorkshopCredentials(header('owner:short'), user, 'short'), false);
});
test('rejects absent, malformed and incorrect credentials', () => {
  for (const value of [null, 'Bearer token', 'Basic !!!', header('other:'+password), header(user+':wrong'), 'Basic '+ 'a'.repeat(5000)]) {
    assert.equal(validWorkshopCredentials(value, user, password), false);
  }
});
