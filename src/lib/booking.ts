import { prisma } from "./db";
import { Prisma } from "@prisma/client";
import { Resend } from "resend";
import { getSiteSettings } from "@/lib/content";
import { formatNZD } from "./money";
import { dateLabel, timeLabel } from "./time";

type CartLine = { priceOptionId: string; label: string; unitPriceCents: number; qty: number; seats: number };
type Contact = { fullName: string; email: string; phone?: string; notes?: string };

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
function makeReference(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `KJ-${s}`;
}

/**
 * Commit a paid reservation into a Booking. Idempotent: if a booking already
 * exists for this PaymentIntent, returns it. This is the ONLY place a booking
 * is created and capacity is finalized.
 */
export async function commitReservation(
  reservationId: string,
  paymentIntentId: string,
): Promise<{ reference: string; alreadyExisted: boolean }> {
  // Idempotency: existing booking for this PI?
  const existing = await prisma.booking.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { reference: true },
  });
  if (existing) return { reference: existing.reference, alreadyExisted: true };

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { session: { include: { tour: true } } },
  });
  if (!reservation) throw new Error(`Reservation ${reservationId} not found`);

  const lines = (reservation.cartSnapshot as unknown as CartLine[]) ?? [];
  const contact = (reservation.contactSnapshot as unknown as Contact | null) ?? {
    fullName: "Guest",
    email: "unknown@example.com",
  };

  const reference = makeReference();

  await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: { email: contact.email, fullName: contact.fullName, phone: contact.phone || null },
    });
    await tx.booking.create({
      data: {
        reference,
        sessionId: reservation.sessionId,
        customerId: customer.id,
        reservationId: reservation.id,
        seats: reservation.seats,
        totalCents: reservation.totalCents,
        currency: "NZD",
        stripePaymentIntentId: paymentIntentId,
        status: "CONFIRMED",
        notes: contact.notes || null,
        items: {
          create: lines.map((l) => ({
            priceOptionId: l.priceOptionId,
            label: l.label,
            unitPriceCents: l.unitPriceCents,
            qty: l.qty,
            seats: l.seats,
          })),
        },
      },
    });
    await tx.reservation.update({ where: { id: reservation.id }, data: { status: "CONVERTED" } });
  });

  // Fire-and-forget confirmation email (don't block the webhook response).
  void sendConfirmationEmail({
    reference,
    to: contact.email,
    tourTitle: reservation.session.tour.title,
    startsAtUtc: reservation.session.startsAtUtc,
    totalCents: reservation.totalCents,
    lines,
  }).catch((e) => console.error("Confirmation email failed:", e));

  return { reference, alreadyExisted: false };
}

async function sendConfirmationEmail(args: {
  reference: string;
  to: string;
  tourTitle: string;
  startsAtUtc: Date;
  totalCents: number;
  lines: CartLine[];
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[booking] (no RESEND_API_KEY) confirmation ${args.reference} for ${args.to}`);
    return;
  }
  const resend = new Resend(apiKey);
  const site = await getSiteSettings();
  const itemsText = args.lines.map((l) => `  ${l.qty} × ${l.label} — ${formatNZD(l.unitPriceCents * l.qty)}`).join("\n");
  await resend.emails.send({
    from: process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`,
    to: args.to,
    subject: `Booking confirmed: ${args.tourTitle} (${args.reference})`,
    text:
      `Thank you for booking with ${site.name}!\n\n` +
      `Booking reference: ${args.reference}\n` +
      `Tour: ${args.tourTitle}\n` +
      `Date: ${dateLabel(args.startsAtUtc)}\n` +
      `Departs: ${timeLabel(args.startsAtUtc)} (NZ time)\n\n` +
      `${itemsText}\n\n` +
      `Total paid: ${formatNZD(args.totalCents)} NZD\n\n` +
      `We look forward to seeing you!\n${site.name}\n${site.phone}`,
  });
}

export { Prisma };
