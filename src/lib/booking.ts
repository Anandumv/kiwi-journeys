import { prisma } from "./db";
import { Prisma } from "@prisma/client";
import { enqueueBookingEmails } from "./email-jobs";
import { getSiteSettings } from "@/lib/content";
import { formatNZD } from "./money";
import { dateLabel, timeLabel } from "./time";
import { sendAdminWhatsApp, sendCustomerWhatsApp } from "./whatsapp";
import { makeBookingReference } from "./codes";

type CartLine = { priceOptionId: string; label: string; unitPriceCents: number; qty: number; seats: number };
type Contact = {
  fullName: string;
  email: string;
  phone?: string;
  notes?: string;
  marketingConsent?: boolean;
  promoCodeId?: string;
  giftVoucherCode?: string;
  giftVoucherDiscountCents?: number;
  payableCents?: number;
};


/**
 * Commit a paid reservation into a Booking. Idempotent: if a booking already
 * exists for this PaymentIntent, returns it. This is the ONLY place a booking
 * is created and capacity is finalized.
 */
export async function commitReservation(
  reservationId: string,
  paymentIntentId: string,
  payment?: { amountReceived: number; currency: string },
): Promise<{ reference: string; alreadyExisted: boolean }> {
  const result = await prisma.$transaction(async (tx) => {
    const initial = await tx.reservation.findUnique({ where: { id: reservationId } });
    if (!initial) throw new Error(`Reservation ${reservationId} not found`);
    // Share the same inventory lock as hold creation and rescheduling.
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "Session" WHERE id = ${initial.sessionId} FOR UPDATE`);
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "Reservation" WHERE id = ${reservationId} FOR UPDATE`);
    const existing = await tx.booking.findUnique({ where: { stripePaymentIntentId: paymentIntentId } });
    if (existing) {
      if (existing.reservationId !== reservationId) throw new Error("Payment belongs to another reservation");
      return { reference: existing.reference, alreadyExisted: true } as const;
    }
    const reservation = await tx.reservation.findUniqueOrThrow({
      where: { id: reservationId }, include: { session: { include: { tour: true } } },
    });
    if (reservation.stripePaymentIntentId !== paymentIntentId) throw new Error("Payment intent mismatch");
    if (reservation.status === "CONVERTED" || reservation.status === "CANCELLED") throw new Error("Reservation is not payable");
    if (reservation.session.status !== "SCHEDULED") throw new Error("Departure is cancelled");
    const now = new Date();
    const [booked, held] = await Promise.all([
      tx.booking.aggregate({ where: { sessionId: reservation.sessionId, status: "CONFIRMED" }, _sum: { seats: true } }),
      tx.reservation.aggregate({ where: { sessionId: reservation.sessionId, id: { not: reservationId }, status: "HELD", expiresAt: { gt: now } }, _sum: { seats: true } }),
    ]);
    if (reservation.seats > reservation.session.capacity - (booked._sum.seats ?? 0) - (held._sum.seats ?? 0)) {
      throw new Error("Paid reservation no longer has capacity; payment requires reconciliation");
    }
    const lines = reservation.cartSnapshot as unknown as CartLine[];
    const contact = reservation.contactSnapshot as unknown as Contact | null;
    if (!contact?.fullName || !contact?.email) throw new Error("Passenger details are missing");
    if (payment && (payment.currency.toLowerCase() !== "nzd" || payment.amountReceived !== (contact.payableCents ?? reservation.totalCents))) {
      throw new Error("Payment amount or currency mismatch; payment requires reconciliation");
    }
    const reference = makeBookingReference();
    let customer = await tx.customer.findFirst({ where: { email: contact.email } });
    if (!customer) customer = await tx.customer.create({ data: {
      email: contact.email, fullName: contact.fullName, phone: contact.phone || null,
      marketingConsent: contact.marketingConsent ?? false,
    } });
    await tx.booking.create({ data: {
      reference, sessionId: reservation.sessionId, customerId: customer.id,
      reservationId, seats: reservation.seats, totalCents: contact.payableCents ?? reservation.totalCents,
      currency: "NZD", stripePaymentIntentId: paymentIntentId, status: "CONFIRMED", notes: contact.notes || null,
      items: { create: lines.map(l => ({ priceOptionId: l.priceOptionId, label: l.label, unitPriceCents: l.unitPriceCents, qty: l.qty, seats: l.seats })) },
    } });
    if (contact.giftVoucherCode && (contact.giftVoucherDiscountCents ?? 0) > 0) {
      const debit = await tx.giftVoucher.updateMany({
        where: { code: contact.giftVoucherCode, isActive: true, balanceCents: { gte: contact.giftVoucherDiscountCents! } },
        data: { balanceCents: { decrement: contact.giftVoucherDiscountCents! } },
      });
      if (debit.count !== 1) throw new Error("Voucher balance changed; payment requires reconciliation");
    }
    if (contact.promoCodeId) {
      await tx.$queryRaw(Prisma.sql`SELECT id FROM "PromoCode" WHERE id = ${contact.promoCodeId} FOR UPDATE`);
      const promo = await tx.promoCode.findUniqueOrThrow({ where: { id: contact.promoCodeId } });
      if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) throw new Error("Promo limit reached; payment requires reconciliation");
      await tx.promoCode.update({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } });
    }
    await enqueueBookingEmails(tx, {
      reference, to: contact.email, customerName: contact.fullName,
      tourTitle: reservation.session.tour.title, startsAtUtc: reservation.session.startsAtUtc,
      totalCents: contact.payableCents ?? reservation.totalCents, seats: reservation.seats,
    });
    await tx.reservation.update({ where: { id: reservationId }, data: { status: "CONVERTED" } });
    return { reference, alreadyExisted: false, reservation, contact, lines } as const;
  });
  if (result.alreadyExisted) return { reference: result.reference, alreadyExisted: true };
  const { reference, reservation, contact, lines } = result;

  // WhatsApp notifications (fire-and-forget, no-op if env vars absent).
  void getSiteSettings().then((site) => {
    const startsAt = `${dateLabel(reservation.session.startsAtUtc)} at ${timeLabel(reservation.session.startsAtUtc)} NZT`;
    const adminPhone = process.env.ADMIN_WHATSAPP || site.phone;
    if (adminPhone) {
      void sendAdminWhatsApp({
        adminPhone,
        reference,
        tourTitle: reservation.session.tour.title,
        startsAt,
        customerName: contact.fullName,
        customerEmail: contact.email,
        seats: reservation.seats,
        totalNZD: formatNZD(reservation.totalCents),
      });
    }
    if (contact.phone) {
      void sendCustomerWhatsApp({
        phone: contact.phone,
        firstName: contact.fullName.split(" ")[0],
        reference,
        tourTitle: reservation.session.tour.title,
        startsAt,
        siteName: site.name,
        sitePhone: site.phone,
      });
    }
  }).catch((e) => console.error("WhatsApp notifications failed:", e));

  // Auto-subscribe to newsletter if marketing consent was given at checkout.
  if (contact.marketingConsent) {
    void prisma.newsletterSubscriber.upsert({
      where: { email: contact.email },
      create: { email: contact.email },
      update: {},
    }).catch((e) => console.error("Newsletter upsert failed:", e));
  }

  return { reference, alreadyExisted: false };
}

export { Prisma };
