import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/db';
import { GET } from '../src/app/api/cron/waitlist-notify/route';
import { POST } from '../src/app/api/waitlist/route';

function stub(t: TestContext, object: object, key: string, value: (...args: any[]) => any) {
  const target = object as Record<string, unknown>;
  const original = target[key];
  target[key] = value;
  t.after(() => { target[key] = original; });
}

test('waitlist cannot attach to another tour’s departure', async (t) => {
  stub(t, prisma.tour, 'findUnique', async () => ({ title: 'Tour A' }));
  stub(t, prisma.session, 'findFirst', async () => null);
  stub(t, prisma.waitlist, 'create', async () => { throw new Error('Invalid entry reached persistence'); });
  const response = await POST(new Request('http://localhost/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tourId: 'a', sessionId: 'other-tour', fullName: 'Test', email: 'test@example.invalid', seats: 1 }) }));
  assert.equal(response.status, 404);
});

test('provider rejection leaves a waitlist notification pending', async (t) => {
  process.env.CRON_SECRET = 'audit-only';
  process.env.RESEND_API_KEY = 're_audit_only';
  const state = { notified: false };
  stub(t, prisma.waitlist, 'findMany', async () => [{ id: 'wl', tourId: 'a', sessionId: 's', seats: 1, fullName: 'Test', email: 'test@example.invalid', tourTitle: 'Tour A' }]);
  stub(t, prisma.siteSetting, 'findUnique', async () => null);
  stub(t, prisma.session, 'findUnique', async () => ({ status: 'SCHEDULED', tourId: 'a', startsAtUtc: new Date(Date.now() + 86400000), capacity: 6, bookings: [], reservations: [], tour: { slug: 'a', isActive: true } }));
  stub(t, prisma.waitlist, 'update', async () => { state.notified = true; return {}; });
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ name: 'validation_error', message: 'Rejected' }), { status: 422, headers: { 'Content-Type': 'application/json' } }));
  const response = await GET(new Request('http://localhost/api/cron/waitlist-notify', { headers: { Authorization: 'Bearer audit-only' } }));
  assert.equal((await response.json()).notified, 0);
  assert.equal(state.notified, false);
});

test('active holds prevent premature waitlist notifications', async (t) => {
  process.env.CRON_SECRET = 'audit-only';
  process.env.RESEND_API_KEY = 're_audit_only';
  let attempts = 0;
  stub(t, prisma.waitlist, 'findMany', async () => [{ id: 'wl', tourId: 'a', sessionId: 's', seats: 1, fullName: 'Test', email: 'test@example.invalid', tourTitle: 'Tour A' }]);
  stub(t, prisma.siteSetting, 'findUnique', async () => null);
  stub(t, prisma.session, 'findUnique', async () => ({ status: 'SCHEDULED', tourId: 'a', startsAtUtc: new Date(Date.now() + 86400000), capacity: 6, bookings: [{ seats: 5 }], reservations: [{ seats: 1 }], tour: { slug: 'a', isActive: true } }));
  stub(t, prisma.waitlist, 'update', async () => ({}));
  t.mock.method(globalThis, 'fetch', async () => { attempts++; return new Response(JSON.stringify({ id: 'fake' }), { headers: { 'Content-Type': 'application/json' } }); });
  const response = await GET(new Request('http://localhost/api/cron/waitlist-notify', { headers: { Authorization: 'Bearer audit-only' } }));
  assert.equal((await response.json()).notified, 0);
  assert.equal(attempts, 0);
});
