import test from 'node:test';
import assert from 'node:assert/strict';
import { configuredWorkshopAuth, isAuthorizedWorkshopUser, isWorkshopAdminEmail } from '../src/lib/workshop-auth.ts';
const config = { supabaseUrl: 'https://example.supabase.co', supabasePublishableKey: 'sb_publishable_test', adminEmail: 'admin@example.com' };
test('Google access requires complete configuration', () => {
  assert.equal(configuredWorkshopAuth(config), true);
  assert.equal(configuredWorkshopAuth({ ...config, adminEmail: '' }), false);
  assert.equal(configuredWorkshopAuth({ ...config, supabasePublishableKey: '' }), false);
});
test('authorizes only the configured email', () => {
  assert.equal(isWorkshopAdminEmail('ADMIN@example.com', config), true);
  assert.equal(isWorkshopAdminEmail('other@example.com', config), false);
  assert.equal(isWorkshopAdminEmail(undefined, config), false);
});
test('requires a confirmed Google identity as well as the configured email', () => {
  const googleUser = { email: 'admin@example.com', email_confirmed_at: '2026-11-06T00:00:00Z', identities: [{ provider: 'email' }, { provider: 'google' }] };
  assert.equal(isAuthorizedWorkshopUser(googleUser, config), true);
  assert.equal(isAuthorizedWorkshopUser({ ...googleUser, identities: [{ provider: 'email' }] }, config), false);
  assert.equal(isAuthorizedWorkshopUser({ ...googleUser, email_confirmed_at: null }, config), false);
  assert.equal(isAuthorizedWorkshopUser({ ...googleUser, email: 'other@example.com' }, config), false);
});
