import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/db';
import { POST } from '../src/app/api/reservations/[id]/contact/route';
// Stub persistence to test the HTTP trust boundary without touching a real database.
const reservation = { status: 'HELD', totalCents: 10000, expiresAt: new Date(Date.now()+600000), stripePaymentIntentId: null };
(prisma.reservation.findUnique as any) = async () => reservation;
(prisma.$transaction as any) = async (fn: any) => fn(prisma);
(prisma.$queryRaw as any) = async () => [];
let saved: any;
(prisma.reservation.update as any) = async (args: any) => { saved=args.data; return args.data; };
const contact = { fullName:'Test Guest', email:'test@example.com' };
async function post(extra: object) {
  return POST(new Request('http://localhost/api/reservations/test/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...contact,...extra}) }), {params:Promise.resolve({id:'test'})});
}
test('browser supplied discount cannot reduce the payable total', async () => {
  saved=undefined;
  const response=await post({giftVoucherDiscountCents:9999});
  assert.equal(response.status,200);
  assert.equal(saved.contactSnapshot.giftVoucherDiscountCents ?? 0,0);
});
test('expired holds cannot accept checkout details', async () => {
  reservation.expiresAt=new Date(0);
  assert.equal((await post({})).status,409);
});
