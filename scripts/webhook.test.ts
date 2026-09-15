import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/db';
process.env.STRIPE_SECRET_KEY = 'sk_test_isolated';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_isolated';
let mutations: unknown[] = [];
(prisma.reservation.updateMany as any) = async (args: unknown) => { mutations.push(args); return {count:1}; };
(prisma.booking.updateMany as any) = async (args: unknown) => { mutations.push(args); return {count:1}; };
async function event(type: string, object: object) {
  const {getStripe} = await import('../src/lib/stripe');
  (getStripe().webhooks.constructEvent as any) = () => ({type,data:{object}});
  const {POST} = await import('../src/app/api/stripe/webhook/route');
  mutations = [];
  const response = await POST(new Request('http://localhost/api/stripe/webhook',{method:'POST',headers:{'stripe-signature':'test'},body:'{}'}));
  assert.equal(response.status,200);
}
test('declined payment preserves the hold so the customer can retry', async () => {
 await event('payment_intent.payment_failed',{id:'pi_test',metadata:{reservationId:'r_test'}});
 assert.equal(mutations.length,0);
});
test('partial refund does not release booked seats', async () => {
 await event('charge.refunded',{payment_intent:'pi_test',refunded:false,amount:10000,amount_refunded:1000});
 assert.equal(mutations.length,0);
});
test('full refund releases booked seats', async () => {
 // The actual full-refund transaction is covered against PostgreSQL.
 const {confirmFullRefund}=await import('../src/lib/refund');
 (prisma.$transaction as any)=async(fn:any)=>fn(prisma);
 (prisma.$queryRaw as any)=async()=>[];
 (prisma.siteSetting.findUnique as any)=async()=>null;
 (prisma.booking.findUnique as any)=async()=>({id:'b_test',reference:'KJ-TEST',status:'CONFIRMED',totalCents:10000,customer:{email:'test@example.invalid',fullName:'Test'},session:{tour:{title:'Test'}}});
 (prisma.booking.update as any)=async(args:unknown)=>{mutations.push(args);};
 (prisma.emailJob.create as any)=async()=>({});
 mutations=[];await confirmFullRefund('pi_test');assert.equal(mutations.length,1);
});
