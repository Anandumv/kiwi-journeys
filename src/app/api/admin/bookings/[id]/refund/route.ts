import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";
import { getCurrentAdmin } from "@/lib/auth";
import { requestBookingRefund } from "@/lib/refund";

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

  if (!isStripeConfigured() || !booking.stripePaymentIntentId) return NextResponse.json({ error: "Refund service is unavailable. No refund has been processed." }, { status: 503 });
  try {
    const refund = await requestBookingRefund(booking.id, booking.stripePaymentIntentId);
    // charge.refunded confirms a full refund and releases inventory. Pending or
    // failed refunds must not make seats available to another customer.
    return NextResponse.json({ ok: true, status: refund.status,
      message: "Refund requested. Booking status updates when Stripe confirms the full refund." }, { status: 202 });
  } catch (e) {
    console.error("Refund request failed:", e);
    return NextResponse.json({ error: "Refund could not be confirmed. Check Stripe before retrying." }, { status: 502 });
  }
}
