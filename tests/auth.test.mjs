import test from 'node:test';
import assert from 'node:assert/strict';
import { configuredWorkshopAuth, isWorkshopAdminEmail } from '../src/lib/workshop-auth.ts';
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
