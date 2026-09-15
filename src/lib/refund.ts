import { getStripe } from "./stripe";

/** Requesting a refund is not proof that the full charge has been refunded. */
export async function requestBookingRefund(bookingId: string, paymentIntentId: string) {
  const refund = await getStripe().refunds.create({ payment_intent: paymentIntentId },
    { idempotencyKey: `booking-refund-${bookingId}` });
  if (refund.status === "failed" || refund.status === "canceled") throw new Error("Refund was not accepted");
  return { status: refund.status ?? "pending" };
}

/** Only a full charge.refunded event may release booked seats. */
export async function confirmFullRefund(paymentIntentId: string) {
  const { prisma } = await import("./db");
  const { Prisma } = await import("@prisma/client");
  const { getSiteSettings } = await import("./content");
  const site = await getSiteSettings();
  await prisma.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "Booking" WHERE "stripePaymentIntentId" = ${paymentIntentId} FOR UPDATE`);
    const booking = await tx.booking.findUnique({ where: { stripePaymentIntentId: paymentIntentId },
      include: { customer: true, session: { include: { tour: true } } } });
    if (!booking || booking.status === "REFUNDED") return;
    await tx.booking.update({ where: { id: booking.id }, data: { status: "REFUNDED" } });
    await tx.emailJob.create({ data: {
      id: `refund-${booking.id}`, bookingReference: booking.reference,
      sender: process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`,
      recipient: booking.customer.email,
      subject: `Refund confirmed: ${booking.session.tour.title} (${booking.reference})`,
      body: `Hi ${booking.customer.fullName},\n\nStripe has confirmed the full card refund for booking ${booking.reference}.\nAmount: NZD ${(booking.totalCents / 100).toFixed(2)}\n\nThe time it takes to appear on your statement depends on your payment provider.\n\nQuestions? ${site.email}\n${site.name}`,
    } });
  });
}
