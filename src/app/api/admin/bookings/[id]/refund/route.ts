import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Refund a booking via Stripe and mark it REFUNDED (frees seats).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id }, select: { id: true, status: true, stripePaymentIntentId: true } });
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
  return NextResponse.json({ ok: true });
}
