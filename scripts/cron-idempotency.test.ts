import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/db';
import { GET as reminders } from '../src/app/api/cron/send-reminders/route';
import { GET as surveys } from '../src/app/api/cron/post-tour-survey/route';
import { GET as recovery } from '../src/app/api/cron/abandoned-recovery/route';

function stub(t: TestContext, object: object, key: string, value: (...args: any[]) => any) {
  const target = object as Record<string, unknown>;
  const original = target[key];
  target[key] = value;
  t.after(() => { target[key] = original; });
}

// An EmailJob table that honours primary keys like createMany({ skipDuplicates }).
function jobTable(t: TestContext) {
  const ids = new Set<string>();
  const createMany = async ({ data, skipDuplicates }: { data: { id: string }[]; skipDuplicates?: boolean }) => {
    let count = 0;
    for (const row of data) {
      if (ids.has(row.id)) { if (!skipDuplicates) throw new Error('duplicate id'); continue; }
      ids.add(row.id); count++;
    }
    return { count };
  };
  stub(t, prisma.emailJob, 'createMany', createMany);
  return { ids, createMany };
}

const cron = (path: string) => new Request(`http://localhost/api/cron/${path}`, { headers: { Authorization: 'Bearer audit-only' } });
const booking = (id: string, hoursAhead: number) => ({
  id, reference: `KJ-${id}`, seats: 2,
  customer: { fullName: 'Test Guest', email: `${id}@example.invalid` },
  session: { startsAtUtc: new Date(Date.now() + hoursAhead * 3600000), tour: { title: 'Tour A', pickup: 'Central', importantInfo: [] } },
});

test('hourly reminder runs queue one reminder per booking and kind', async (t) => {
  process.env.CRON_SECRET = 'audit-only';
  const jobs = jobTable(t);
  stub(t, prisma.siteSetting, 'findUnique', async () => null);
  let call = 0;
  stub(t, prisma.booking, 'findMany', async () => (call++ % 2 === 0 ? [booking('b7', 168)] : [booking('b1', 24)]));
  const first = await (await reminders(cron('send-reminders'))).json();
  const second = await (await reminders(cron('send-reminders'))).json();
  assert.equal(first.queued, 2);
  assert.equal(second.queued, 0);
  assert.deepEqual([...jobs.ids].sort(), ['reminder-24h-b1', 'reminder-7d-b7']);
});

test('the two-day survey window sends one survey per booking', async (t) => {
  process.env.CRON_SECRET = 'audit-only';
  const jobs = jobTable(t);
  stub(t, prisma.siteSetting, 'findUnique', async () => null);
  stub(t, prisma.booking, 'findMany', async () => [booking('s1', -30)]);
  stub(t, prisma.surveyResponse, 'findMany', async () => []);
  assert.equal((await (await surveys(cron('post-tour-survey'))).json()).queued, 1);
  assert.equal((await (await surveys(cron('post-tour-survey'))).json()).queued, 0);
  assert.deepEqual([...jobs.ids], ['survey-s1']);
});

test('recovery claims the hold before queuing, so a concurrent run sends nothing', async (t) => {
  process.env.CRON_SECRET = 'audit-only';
  const jobs = jobTable(t);
  stub(t, prisma.siteSetting, 'findUnique', async () => null);
  stub(t, prisma.reservation, 'findMany', async () => [{ id: 'r1', contactSnapshot: { fullName: 'Test Guest', email: 'r1@example.invalid' }, session: { tour: { title: 'Tour A', slug: 'a' } } }]);
  let claims = 1;
  const tx = { reservation: { updateMany: async () => ({ count: claims-- > 0 ? 1 : 0 }) }, emailJob: { createMany: jobs.createMany } };
  stub(t, prisma, '$transaction', async (fn: (client: typeof tx) => unknown) => fn(tx));
  assert.equal((await (await recovery(cron('abandoned-recovery'))).json()).sent, 1);
  assert.equal((await (await recovery(cron('abandoned-recovery'))).json()).sent, 0);
  assert.deepEqual([...jobs.ids], ['recovery-r1']);
});
