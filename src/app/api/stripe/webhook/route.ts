import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { commitReservation } from "@/lib/booking";

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
