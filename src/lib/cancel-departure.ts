import { prisma } from './db';
import { getSiteSettings } from './content';
import { dateLabel, timeLabel } from './time';

export async function cancelDeparture(sessionId: string, tourId: string) {
  const site = await getSiteSettings();
  const sender = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Session" WHERE id = ${sessionId} FOR UPDATE`;
    const session = await tx.session.findUnique({ where: { id: sessionId }, include: { tour: true, bookings: { where: { status: 'CONFIRMED' }, include: { customer: true } } } });
    if (!session || session.tourId !== tourId) throw new Error('Departure does not belong to this tour.');
    if (session.status === 'CANCELLED') return;
    await tx.session.update({ where: { id: sessionId }, data: { status: 'CANCELLED' } });
    await tx.emailJob.createMany({ data: session.bookings.map(b => ({
      id: `departure-cancelled-${sessionId}-${b.reference}`,
      bookingReference: b.reference, recipient: b.customer.email, sender,
      subject: `Your ${session.tour.title} departure has been cancelled`,
      body: `Hi ${b.customer.fullName},\n\nWe are sorry that the ${session.tour.title} departure on ${dateLabel(session.startsAtUtc)} at ${timeLabel(session.startsAtUtc)} (NZ time) has been cancelled.\n\nYour booking reference is ${b.reference}. Our team needs to arrange your refund or an alternative date. A refund has not yet been confirmed; we will send confirmation when it has been processed. Please contact ${site.email} or ${site.phone}.\n\n${site.name}`,
    })) });
  });
}
