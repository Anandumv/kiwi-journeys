import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createHold, SoldOutError, type CartLine } from "@/lib/availability";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSiteSettings } from "@/lib/content";

export const dynamic = "force-dynamic";

const schema = z.object({
  sessionId: z.string().min(1),
  items: z
    .array(z.object({ priceOptionId: z.string().min(1), qty: z.number().int().min(0).max(50) }))
    .min(1),
});

const HOLD_MINUTES = Number(process.env.RESERVATION_HOLD_MINUTES || "10");

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { sessionId, items } = parsed.data;

  // Load the session + its tour's price options (authoritative pricing).
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { tour: { include: { priceOptions: true } } },
  });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.status !== "SCHEDULED" || session.startsAtUtc <= new Date()) {
    return NextResponse.json({ error: "This departure is no longer available" }, { status: 409 });
  }

  const optsById = new Map(session.tour.priceOptions.map((p) => [p.id, p]));
  const lines: CartLine[] = [];
  for (const item of items) {
    if (item.qty <= 0) continue;
    const po = optsById.get(item.priceOptionId);
    if (!po) return NextResponse.json({ error: "Invalid price option" }, { status: 400 });
    lines.push({
      priceOptionId: po.id,
      key: po.key,
      label: po.label,
      unitPriceCents: po.priceCents,
      qty: item.qty,
      seats: item.qty * po.seatsPerUnit,
    });
  }
  if (lines.length === 0) {
    return NextResponse.json({ error: "Select at least one guest" }, { status: 400 });
  }

  // Create the row-locked HELD reservation (overbooking guard).
  let hold;
  try {
    hold = await createHold({ sessionId, lines, holdMinutes: HOLD_MINUTES });
  } catch (e) {
    if (e instanceof SoldOutError) {
      return NextResponse.json(
        { error: "SOLD_OUT", available: e.available },
        { status: 409 },
      );
    }
    console.error("createHold failed:", e);
    return NextResponse.json({ error: "Could not reserve seats" }, { status: 500 });
  }

  // Create the Stripe PaymentIntent and attach it to the reservation.
  let clientSecret: string | null = null;
  if (isStripeConfigured()) {
    try {
      const stripe = getStripe();
      const site = await getSiteSettings();
      const pi = await stripe.paymentIntents.create({
        amount: hold.totalCents,
        currency: "nzd",
        automatic_payment_methods: { enabled: true },
        metadata: {
          reservationId: hold.reservationId,
          tourSlug: session.tour.slug,
          tourTitle: session.tour.title,
        },
        description: `${site.name} — ${session.tour.title}`,
      });
      clientSecret = pi.client_secret;
      await prisma.reservation.update({
        where: { id: hold.reservationId },
        data: { stripePaymentIntentId: pi.id },
      });
    } catch (e) {
      console.error("Stripe PaymentIntent failed:", e);
      // Release the hold so seats aren't stuck.
      await prisma.reservation.update({
        where: { id: hold.reservationId },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json({ error: "Payment setup failed" }, { status: 502 });
    }
  }

  return NextResponse.json({
    reservationId: hold.reservationId,
    totalCents: hold.totalCents,
    seats: hold.seats,
    expiresAt: hold.expiresAt.toISOString(),
    clientSecret,
    stripeConfigured: isStripeConfigured(),
  });
}
