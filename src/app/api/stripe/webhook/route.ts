import { after, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { processPaidReservation } from "@/lib/payment-reconciliation";
import { processEmailJobs } from "@/lib/email-jobs";
import { confirmFullRefund } from "@/lib/refund";
import { activateGiftVoucher } from "@/lib/gift-voucher-activation";

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
          // Events may arrive out of order. Never create a booking from an old
          // succeeded event after the charge has already been refunded.
          const current = await getStripe().paymentIntents.retrieve(pi.id, { expand: ["latest_charge"] });
          if (current.status !== "succeeded" || current.metadata.reservationId !== reservationId) throw new Error("Payment state mismatch");
          const charge = current.latest_charge;
          if (!charge || typeof charge === "string") throw new Error("Charge state unavailable");
          if (charge.refunded) {
            await confirmFullRefund(pi.id);
            await prisma.paymentIssue.updateMany({ where: { paymentIntentId: pi.id },
              data: { resolvedAt: new Date(), reason: "Full refund verified with Stripe." } });
          } else {
            await processPaidReservation({ reservationId, id: pi.id, amountReceived: current.amount_received,
              currency: current.currency, refundedCents: charge.amount_refunded });
          }
          after(async () => { await processEmailJobs(); });
        }
        if (pi.metadata?.giftVoucher === "true" && pi.metadata?.giftVoucherId) {
          await activateGiftVoucher(pi.metadata.giftVoucherId, pi);
          after(async () => { await processEmailJobs(); });
        }
        break;
      }
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
        if (piId && charge.refunded) {
          await confirmFullRefund(piId);
          after(async () => { await processEmailJobs(); });
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
