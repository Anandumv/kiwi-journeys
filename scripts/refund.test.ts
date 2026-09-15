import test from 'node:test';
import assert from 'node:assert/strict';
process.env.STRIPE_SECRET_KEY='sk_test_isolated';
test('pending refund remains pending and retries reuse the same request key',async()=>{
 const {getStripe}=await import('../src/lib/stripe');
 const keys:string[]=[];
 (getStripe().refunds.create as any)=async (_:unknown,options:{idempotencyKey:string})=>{keys.push(options.idempotencyKey);return {status:'pending'};};
 const {requestBookingRefund}=await import('../src/lib/refund');
 assert.equal((await requestBookingRefund('b_test','pi_test')).status,'pending');
 await requestBookingRefund('b_test','pi_test');
 assert.equal(keys[0],keys[1]);
});
test('failed Stripe refund is not reported as accepted',async()=>{
 const {getStripe}=await import('../src/lib/stripe');
 (getStripe().refunds.create as any)=async()=>({status:'failed'});
 const {requestBookingRefund}=await import('../src/lib/refund');
 await assert.rejects(requestBookingRefund('b_test','pi_test'));
});
