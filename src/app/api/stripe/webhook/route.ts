import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { commitReservation } from "@/lib/booking";
import { Resend } from "resend";
import { getSiteSettings } from "@/lib/content";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Stripe webhook — the ONLY place a booking is committed.
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret || secret === "whsec_xxx") {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    console.error("Webhook signature verification failed:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const reservationId = pi.metadata?.reservationId;
        if (reservationId) {
          await commitReservation(reservationId, pi.id);
        }
        if (pi.metadata?.giftVoucher === "true" && pi.metadata?.giftVoucherId) {
          await activateGiftVoucher(pi.metadata.giftVoucherId);
        }
        break;
      }
      case "payment_intent.payment_failed":
      case "payment_intent.canceled": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const reservationId = pi.metadata?.reservationId;
        if (reservationId) {
          // Free the held seats immediately (only if still HELD).
          await prisma.reservation.updateMany({
            where: { id: reservationId, status: "HELD" },
            data: { status: "CANCELLED" },
          });
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (piId) {
          await prisma.booking.updateMany({
            where: { stripePaymentIntentId: piId },
            data: { status: "REFUNDED" },
          });
        }
        break;
      }
    }
  } catch (e) {
    console.error("Webhook handler error:", e);
    // Return 500 so Stripe retries.
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function activateGiftVoucher(voucherId: string) {
  const voucher = await prisma.giftVoucher.findUnique({ where: { id: voucherId } });
  if (!voucher || voucher.isActive) return; // idempotent

  await prisma.giftVoucher.update({ where: { id: voucherId }, data: { isActive: true } });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const site = await getSiteSettings();
  const from = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";
  const expiryStr = voucher.expiresAt
    ? voucher.expiresAt.toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })
    : "no expiry";

  await resend.emails
    .send({
      from,
      to: voucher.purchaserEmail,
      subject: `Your ${site.name} gift voucher is ready! (${voucher.code})`,
      text:
        `Hi ${voucher.purchaserName.split(" ")[0]},\n\n` +
        `Your gift voucher has been activated!\n\n` +
        `  Code: ${voucher.code}\n` +
        `  Value: NZD ${(voucher.amountCents / 100).toFixed(2)}\n` +
        `  Valid until: ${expiryStr}\n\n` +
        (voucher.recipientName ? `  For: ${voucher.recipientName}\n\n` : "") +
        `The recipient can enter this code at checkout on any tour:\n` +
        `${baseUrl}/tours\n\n` +
        `Thank you for choosing ${site.name}!\n${site.phone}`,
    })
    .catch((e) => console.error("GV purchaser email failed:", e));

  if (voucher.recipientEmail && voucher.recipientEmail !== voucher.purchaserEmail) {
    await resend.emails
      .send({
        from,
        to: voucher.recipientEmail,
        subject: `You've received a ${site.name} gift voucher!`,
        text:
          `Hi ${voucher.recipientName || "there"},\n\n` +
          `${voucher.purchaserName} has sent you a gift voucher for a New Zealand South Island adventure!\n\n` +
          (voucher.message ? `"${voucher.message}"\n\n` : "") +
          `  Code: ${voucher.code}\n` +
          `  Value: NZD ${(voucher.amountCents / 100).toFixed(2)}\n` +
          `  Valid until: ${expiryStr}\n\n` +
          `Use this code at checkout when booking any tour:\n${baseUrl}/tours\n\n` +
          `We can't wait to show you New Zealand!\n${site.name}`,
      })
      .catch((e) => console.error("GV recipient email failed:", e));
  }
}
