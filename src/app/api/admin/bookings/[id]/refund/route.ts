import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getCurrentAdmin } from "@/lib/auth";
import { Resend } from "resend";
import { getSiteSettings } from "@/lib/content";
import { formatNZD } from "@/lib/money";
import { dateLabel } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      stripePaymentIntentId: true,
      reference: true,
      totalCents: true,
      customer: { select: { email: true, fullName: true } },
      session: { select: { startsAtUtc: true, tour: { select: { title: true } } } },
    },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.status === "REFUNDED") return NextResponse.json({ ok: true, already: true });

  if (isStripeConfigured() && booking.stripePaymentIntentId) {
    try {
      await getStripe().refunds.create({ payment_intent: booking.stripePaymentIntentId });
    } catch (e) {
      console.error("Refund failed:", e);
      return NextResponse.json({ error: "Stripe refund failed" }, { status: 502 });
    }
  }
  await prisma.booking.update({ where: { id }, data: { status: "REFUNDED" } });

  // Notify the customer their refund is on its way.
  void sendRefundEmail(booking).catch((e) => console.error("Refund email failed:", e));

  return NextResponse.json({ ok: true });
}

async function sendRefundEmail(booking: {
  reference: string;
  totalCents: number;
  customer: { email: string; fullName: string };
  session: { startsAtUtc: Date; tour: { title: string } };
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const site = await getSiteSettings();
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`,
    to: booking.customer.email,
    subject: `Refund processed: ${booking.session.tour.title} (${booking.reference})`,
    text:
      `Hi ${booking.customer.fullName},\n\n` +
      `Your booking has been refunded.\n\n` +
      `Booking reference: ${booking.reference}\n` +
      `Tour: ${booking.session.tour.title}\n` +
      `Date: ${dateLabel(booking.session.startsAtUtc)}\n` +
      `Amount refunded: ${formatNZD(booking.totalCents)} NZD\n\n` +
      `Refunds typically appear on your statement within 5–10 business days, ` +
      `depending on your bank or card issuer.\n\n` +
      `If you have any questions please reply to this email or contact us at ${site.email}.\n\n` +
      `${site.name}`,
  });
}
