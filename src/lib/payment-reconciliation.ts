import { prisma } from "./db";
import { commitReservation } from "./booking";

/** Called only after verifying a Stripe webhook or retrieving the intent from Stripe. */
export async function processPaidReservation(payment: {
  id: string; reservationId: string; amountReceived: number; currency: string; refundedCents?: number;
}) {
  try {
    if ((payment.refundedCents ?? 0) > 0 && !(await prisma.booking.findUnique({ where: { stripePaymentIntentId: payment.id } }))) {
      throw new Error("Refunded payment cannot create a new booking");
    }
    const result = await commitReservation(payment.reservationId, payment.id, payment);
    await prisma.paymentIssue.updateMany({ where: { paymentIntentId: payment.id, resolvedAt: null },
      data: { resolvedAt: new Date() } });
    return result;
  } catch (error) {
    await prisma.paymentIssue.upsert({
      where: { paymentIntentId: payment.id },
      create: { paymentIntentId: payment.id, reservationId: payment.reservationId,
        amountCents: payment.amountReceived, currency: payment.currency,
        reason: "Payment received, but booking could not be completed. Check capacity, reservation state, and discounts before retrying." },
      update: {},
    });
    // Keep Stripe retrying; persistence is an operational safety net, not acknowledgement.
    throw error;
  }
}
