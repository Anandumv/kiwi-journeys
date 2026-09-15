import test from 'node:test';
import assert from 'node:assert/strict';
import { signSession, verifySession } from '../src/lib/auth';
import { signCustomerSession, verifyCustomerSession } from '../src/lib/customerAuth';
process.env.AUTH_SECRET = 'isolated-test-secret-not-a-real-credential';
const identity = { sub: 'test-user', email: 'test@example.com', name: 'Test' };
test('customer token cannot authorize admin access', async () => {
  assert.equal(await verifySession(await signCustomerSession(identity)), null);
});
test('admin token cannot impersonate a customer', async () => {
  assert.equal(await verifyCustomerSession(await signSession({ ...identity, role: 'admin' })), null);
});
test('each session verifies only in its own audience', async () => {
  assert.equal((await verifySession(await signSession({ ...identity, role: 'admin' })))?.sub, identity.sub);
  assert.equal((await verifyCustomerSession(await signCustomerSession(identity)))?.sub, identity.sub);
});
