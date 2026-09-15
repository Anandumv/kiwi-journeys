import { Prisma } from '@prisma/client';
import { prisma } from './db';
import { SoldOutError } from './availability';

/** Serialize rescheduling with holds and paid booking completion. */
export async function rescheduleBooking(bookingId: string, newSessionId: string, email: string, now = new Date()) {
  return prisma.$transaction(async tx => {
    const initial = await tx.booking.findUniqueOrThrow({where:{id:bookingId}});
    const ids = [initial.sessionId,newSessionId].sort();
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "Session" WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE`);
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "Booking" WHERE id = ${bookingId} FOR UPDATE`);
    const booking = await tx.booking.findUniqueOrThrow({where:{id:bookingId},include:{session:true,customer:true}});
    if (booking.customer.email !== email || booking.status !== 'CONFIRMED' || booking.sessionId !== initial.sessionId) throw new Error('Booking changed. Please refresh and try again.');
    if (booking.session.startsAtUtc.getTime() - now.getTime() < 48*3600000) throw new Error('Rescheduling closes 48 hours before departure.');
    const target=await tx.session.findUniqueOrThrow({where:{id:newSessionId}});
    if(target.tourId !== booking.session.tourId || target.status !== 'SCHEDULED' || target.startsAtUtc <= now || target.id === booking.sessionId) throw new Error('That departure is unavailable.');
    const [booked,held]=await Promise.all([
      tx.booking.aggregate({where:{sessionId:newSessionId,status:'CONFIRMED'},_sum:{seats:true}}),
      tx.reservation.aggregate({where:{sessionId:newSessionId,status:'HELD',expiresAt:{gt:now}},_sum:{seats:true}}),
    ]);
    const available=target.capacity-(booked._sum.seats??0)-(held._sum.seats??0);
    if(available<booking.seats) throw new SoldOutError(Math.max(0,available));
    return tx.booking.update({where:{id:bookingId},data:{sessionId:newSessionId,rescheduledFromSessionId:booking.sessionId,rescheduledAt:now}});
  });
}
