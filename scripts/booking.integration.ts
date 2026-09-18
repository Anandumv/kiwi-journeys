import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { activateGiftVoucher } from '../src/lib/gift-voucher-activation';
import { processEmailJobs } from '../src/lib/email-jobs';
import { confirmFullRefund } from '../src/lib/refund';
import { processPaidReservation } from '../src/lib/payment-reconciliation';
import { prisma } from '../src/lib/db';
import { createHold, SoldOutError, remainingForSessions, generateSessions } from '../src/lib/availability';
import { POST as checkoutContact } from '../src/app/api/reservations/[id]/contact/route';
import { rescheduleBooking } from '../src/lib/reschedule';
import { commitReservation } from '../src/lib/booking';
if (new URL(process.env.DATABASE_URL!).pathname !== '/kiwi_journeys_audit_test') throw new Error('Test database required');
async function fixture(capacity=1) {
 const tour=await prisma.tour.create({data:{slug:`audit-${randomUUID()}`,title:'Audit tour',summary:'Test',destination:'Test',durationMins:60,priceOptions:{create:{key:'adult',label:'Adult',priceCents:10000}}},include:{priceOptions:true}});
 const session=await prisma.session.create({data:{tourId:tour.id,startsAtUtc:new Date(Date.now()+86400000*5),localDate:new Date(),capacity}});
 const po=tour.priceOptions[0];
 const line={priceOptionId:po.id,key:'adult',label:'Adult',unitPriceCents:10000,qty:1,seats:1};
 const hold=()=>createHold({sessionId:session.id,lines:[line],holdMinutes:10});
 const prepare=async(id:string)=>prisma.reservation.update({where:{id},data:{stripePaymentIntentId:`pi_${id}`,contactSnapshot:{fullName:'Audit Guest',email:`${tour.id}@example.invalid`}}});
 return {tour,session,hold,prepare};
}
test('last seat admits only one concurrent hold',async()=>{
 const f=await fixture();
 const result=await Promise.allSettled([f.hold(),f.hold()]);
 assert.equal(result.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(result.filter(r=>r.status==='rejected' && r.reason instanceof SoldOutError).length,1);
});
test('concurrent webhook delivery returns the same booking',async()=>{
 const f=await fixture();const h=await f.hold();await f.prepare(h.reservationId);
 const result=await Promise.all([commitReservation(h.reservationId,`pi_${h.reservationId}`),commitReservation(h.reservationId,`pi_${h.reservationId}`)]);
 assert.equal(result[0].reference,result[1].reference);
 assert.equal(await prisma.booking.count({where:{reservationId:h.reservationId}}),1);
});
test('late paid hold cannot overbook another buyer',async()=>{
 const f=await fixture();const h=await f.hold();await f.prepare(h.reservationId);
 await prisma.reservation.update({where:{id:h.reservationId},data:{expiresAt:new Date(0)}});
 await f.hold();
 await assert.rejects(commitReservation(h.reservationId,`pi_${h.reservationId}`));
 assert.equal(await prisma.booking.count({where:{reservationId:h.reservationId}}),0);
 assert.equal((await remainingForSessions([f.session.id])).get(f.session.id),0);
});
test('unrelated payment intent is rejected',async()=>{
 const f=await fixture();const h=await f.hold();await f.prepare(h.reservationId);
 await assert.rejects(commitReservation(h.reservationId,'pi_unrelated'));
});
test('wrong payment amount is rejected before booking creation',async()=>{
 const f=await fixture();const h=await f.hold();await f.prepare(h.reservationId);
 await assert.rejects(commitReservation(h.reservationId,`pi_${h.reservationId}`,{amountReceived:100,currency:'nzd'}));
 assert.equal(await prisma.booking.count({where:{reservationId:h.reservationId}}),0);
});
test('rescheduling competes with a hold for the last seat', async()=>{
 const f=await fixture();const h=await f.hold();await f.prepare(h.reservationId);
 const committed=await commitReservation(h.reservationId,`pi_${h.reservationId}`);
 const booking=await prisma.booking.findUniqueOrThrow({where:{reference:committed.reference},include:{customer:true}});
 const target=await prisma.session.create({data:{tourId:f.tour.id,startsAtUtc:new Date(Date.now()+86400000*6),localDate:new Date(),capacity:1}});
 const po=f.tour.priceOptions[0];
 const results=await Promise.allSettled([
  rescheduleBooking(booking.id,target.id,booking.customer.email),
  createHold({sessionId:target.id,lines:[{priceOptionId:po.id,key:'adult',label:'Adult',unitPriceCents:10000,qty:1,seats:1}],holdMinutes:10}),
 ]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal((await remainingForSessions([target.id])).get(target.id),0);
});
test('concurrent checkouts cannot promise the same voucher balance twice',async()=>{
 const f=await fixture(2);const holds=await Promise.all([f.hold(),f.hold()]);
 const voucher=await prisma.giftVoucher.create({data:{code:`GV-${randomUUID().toUpperCase()}`,amountCents:10000,balanceCents:10000,isActive:true,purchaserName:'Test',purchaserEmail:'test@example.invalid'}});
 const responses=await Promise.all(holds.map(h=>checkoutContact(new Request('http://localhost/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fullName:'Test',email:'test@example.invalid',giftVoucherCode:voucher.code})}),{params:Promise.resolve({id:h.reservationId})})));
 const quotes=await Promise.all(responses.map(r=>r.json()));
 assert.ok(quotes.reduce((sum,q)=>sum+(q.giftVoucherDiscountCents??0),0)<=10000);
});
test('booking and its confirmation jobs commit exactly once together', async()=>{
 const f=await fixture();const h=await f.hold();await f.prepare(h.reservationId);
 const first=await commitReservation(h.reservationId,`pi_${h.reservationId}`);
 await commitReservation(h.reservationId,`pi_${h.reservationId}`);
 const rows=await prisma.$queryRawUnsafe<Array<{count:bigint}>>('SELECT COUNT(*) AS count FROM "EmailJob" WHERE "bookingReference" = $1',first.reference);
 assert.equal(Number(rows[0].count),2);
});
test('failed email remains durable and succeeds on a later retry',async()=>{
 await prisma.emailJob.deleteMany({});
 const job=await prisma.emailJob.create({data:{id:randomUUID(),bookingReference:'TEST',recipient:'test@example.invalid',sender:'test@example.invalid',subject:'Test',body:'Test',availableAt:new Date(0)}});
 await processEmailJobs(1,async()=>{throw new Error('Provider unavailable');});
 const failed=await prisma.emailJob.findUniqueOrThrow({where:{id:job.id}});
 assert.equal(failed.sentAt,null);assert.equal(failed.attempts,1);assert.ok(failed.lastError);assert.ok(failed.availableAt>new Date());
 await prisma.emailJob.update({where:{id:job.id},data:{availableAt:new Date(0)}});
 await processEmailJobs(1,async()=>{});
 assert.ok((await prisma.emailJob.findUniqueOrThrow({where:{id:job.id}})).sentAt);
});
test('concurrent workers claim an email only once',async()=>{
 for(let round=0;round<20;round++) {
  await prisma.emailJob.deleteMany({});
  await prisma.emailJob.create({data:{id:randomUUID(),bookingReference:'TEST',recipient:'test@example.invalid',sender:'test@example.invalid',subject:'Test',body:'Test',availableAt:new Date(0)}});
  let delivered=0;
  await Promise.all([processEmailJobs(1,async()=>{delivered++;}),processEmailJobs(1,async()=>{delivered++;})]);
  assert.equal(delivered,1);
 }
});
test('ambiguous old email attempts stop before provider deduplication expires',async()=>{
 await prisma.emailJob.deleteMany({});
 await prisma.emailJob.create({data:{id:randomUUID(),bookingReference:'TEST',recipient:'test@example.invalid',sender:'test@example.invalid',subject:'Test',body:'Test',availableAt:new Date(0),firstAttemptAt:new Date(Date.now()-24*3600_000)}});
 let delivered=0;await processEmailJobs(1,async()=>{delivered++;});assert.equal(delivered,0);
});
test('paid inventory conflict remains visible and resolves after successful retry',async()=>{
 const f=await fixture();const h=await f.hold();await f.prepare(h.reservationId);
 await prisma.reservation.update({where:{id:h.reservationId},data:{expiresAt:new Date(0)}});
 const competing=await f.hold();
 const payment={id:`pi_${h.reservationId}`,reservationId:h.reservationId,amountReceived:10000,currency:'nzd'};
 await assert.rejects(processPaidReservation(payment));
 assert.equal((await prisma.paymentIssue.findUniqueOrThrow({where:{paymentIntentId:payment.id}})).resolvedAt,null);
 await prisma.reservation.update({where:{id:competing.reservationId},data:{status:'CANCELLED'}});
 await processPaidReservation(payment);
 assert.ok((await prisma.paymentIssue.findUniqueOrThrow({where:{paymentIntentId:payment.id}})).resolvedAt);
});
test('crashed email worker lease can be reclaimed',async()=>{
 await prisma.emailJob.deleteMany({});
 const job=await prisma.emailJob.create({data:{id:randomUUID(),bookingReference:'TEST',recipient:'test@example.invalid',sender:'test@example.invalid',subject:'Test',body:'Test',availableAt:new Date(0),lockedUntil:new Date(0),leaseToken:'dead-worker',attempts:1,firstAttemptAt:new Date()}});
 await processEmailJobs(1,async()=>{});
 assert.ok((await prisma.emailJob.findUniqueOrThrow({where:{id:job.id}})).sentAt);
});
test('concurrent voucher activation persists each delivery once',async()=>{
 const id=randomUUID();
 const voucher=await prisma.giftVoucher.create({data:{code:`GV-${id}`,amountCents:10000,balanceCents:10000,purchaserName:'Test',purchaserEmail:'buyer@example.invalid',recipientEmail:'recipient@example.invalid',stripePaymentIntentId:`pi_${id}`}});
 const payment={id:`pi_${id}`,currency:'nzd',amount_received:10000};
 await Promise.all([activateGiftVoucher(voucher.id,payment),activateGiftVoucher(voucher.id,payment)]);
 assert.equal(await prisma.emailJob.count({where:{bookingReference:voucher.code}}),2);
 assert.equal((await prisma.giftVoucher.findUniqueOrThrow({where:{id:voucher.id}})).isActive,true);
});
test('full refund releases seats and queues exactly one refund email',async()=>{
 const f=await fixture();const h=await f.hold();await f.prepare(h.reservationId);
 const booked=await commitReservation(h.reservationId,`pi_${h.reservationId}`);
 await Promise.all([confirmFullRefund(`pi_${h.reservationId}`),confirmFullRefund(`pi_${h.reservationId}`)]);
 assert.equal((await prisma.booking.findUniqueOrThrow({where:{reference:booked.reference}})).status,'REFUNDED');
 assert.equal((await remainingForSessions([f.session.id])).get(f.session.id),1);
 assert.equal(await prisma.emailJob.count({where:{bookingReference:booked.reference,id:{startsWith:'refund-'}}}),1);
});
test('a partially refunded payment cannot create a new booking',async()=>{
 const f=await fixture();const h=await f.hold();await f.prepare(h.reservationId);
 await assert.rejects(processPaidReservation({id:`pi_${h.reservationId}`,reservationId:h.reservationId,amountReceived:10000,currency:'nzd',refundedCents:1000}));
 assert.equal(await prisma.booking.count({where:{reservationId:h.reservationId}}),0);
});
test('missing email configuration preserves retry attempts',async()=>{
 await prisma.emailJob.deleteMany({});
 const job=await prisma.emailJob.create({data:{id:randomUUID(),bookingReference:'TEST',recipient:'test@example.invalid',sender:'test@example.invalid',subject:'Test',body:'Test',availableAt:new Date(0)}});
 const result=await processEmailJobs(1);
 assert.equal(result.unavailable,true);
 const pending=await prisma.emailJob.findUniqueOrThrow({where:{id:job.id}});
 assert.equal(pending.attempts,0);assert.equal(pending.firstAttemptAt,null);
});
test('regenerating an already-fully-generated tour reports zero conflicts against itself',async()=>{
 const vehicle=await prisma.vehicle.create({data:{name:`Audit Van ${randomUUID()}`,seats:12,isActive:true}});
 const tour=await prisma.tour.create({data:{slug:`audit-self-${randomUUID()}`,title:'Audit self-regen tour',summary:'Test',destination:'Test',durationMins:60,capacityPerDeparture:12,defaultVehicleId:vehicle.id,departureTimes:['09:00'],departureWeekdays:[1,2,3,4,5,6,7]}});
 const genParams={tourId:tour.id,times:['09:00'],weekdays:[1,2,3,4,5,6,7],capacity:12,durationMins:60,vehicleId:vehicle.id,horizonDays:5};
 const first=await generateSessions(genParams);
 assert.ok(first.created>0);
 assert.equal(first.conflicts.length,0);
 const second=await generateSessions(genParams);
 assert.equal(second.created,0);
 assert.equal(second.conflicts.length,0);
});
test('two tours sharing a vehicle with overlapping departures both get created, conflict reported',async()=>{
 const vehicle=await prisma.vehicle.create({data:{name:`Audit Shared Van ${randomUUID()}`,seats:12,isActive:true}});
 const tourA=await prisma.tour.create({data:{slug:`audit-shared-a-${randomUUID()}`,title:'Audit shared vehicle tour A',summary:'Test',destination:'Test',durationMins:60,capacityPerDeparture:12,defaultVehicleId:vehicle.id,departureTimes:['09:00'],departureWeekdays:[1,2,3,4,5,6,7]}});
 const tourB=await prisma.tour.create({data:{slug:`audit-shared-b-${randomUUID()}`,title:'Audit shared vehicle tour B',summary:'Test',destination:'Test',durationMins:60,capacityPerDeparture:12,defaultVehicleId:vehicle.id,departureTimes:['09:00'],departureWeekdays:[1,2,3,4,5,6,7]}});
 const resultA=await generateSessions({tourId:tourA.id,times:['09:00'],weekdays:[1,2,3,4,5,6,7],capacity:12,durationMins:60,vehicleId:vehicle.id,horizonDays:5});
 assert.ok(resultA.created>0);
 const resultB=await generateSessions({tourId:tourB.id,times:['09:00'],weekdays:[1,2,3,4,5,6,7],capacity:12,durationMins:60,vehicleId:vehicle.id,horizonDays:5});
 assert.equal(resultB.created,resultA.created);
 assert.equal(resultB.conflicts.length,resultA.created);
 assert.ok(resultB.conflicts.every(c=>c.conflictingTour===tourA.title));
 assert.equal(await prisma.session.count({where:{tourId:tourA.id}}),resultA.created);
 assert.equal(await prisma.session.count({where:{tourId:tourB.id}}),resultB.created);
});
test.after(async()=>{await prisma.$disconnect();});
