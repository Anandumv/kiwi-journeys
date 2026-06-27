import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const schema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(50).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  marketingConsent: z.boolean().optional().default(false),
  promoCodeId: z.string().optional(),
  giftVoucherCode: z.string().optional(),
  giftVoucherDiscountCents: z.number().int().min(0).optional().default(0),
});

// Save passenger/contact details onto the reservation before payment confirms.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    select: { status: true, totalCents: true, stripePaymentIntentId: true },
  });
  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (reservation.status !== "HELD") {
    return NextResponse.json({ error: "Reservation is no longer active" }, { status: 409 });
  }

  await prisma.reservation.update({
    where: { id },
    data: { contactSnapshot: parsed.data },
  });

  // If a gift voucher discount was applied, update the Stripe PaymentIntent amount.
  const voucherDiscount = parsed.data.giftVoucherDiscountCents ?? 0;
  if (voucherDiscount > 0 && reservation.stripePaymentIntentId && isStripeConfigured()) {
    const netCents = Math.max(100, reservation.totalCents - voucherDiscount);
    try {
      await getStripe().paymentIntents.update(reservation.stripePaymentIntentId, {
        amount: netCents,
      });
    } catch (e) {
      console.error("Failed to update PI amount for gift voucher:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
