import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const schema = z.object({
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().max(50).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  marketingConsent: z.boolean().optional().default(false),
  promoCodeId: z.string().optional(),
  giftVoucherCode: z.string().optional(),

});

// Save passenger/contact details onto the reservation before payment confirms.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  return prisma.$transaction(async (tx) => {
  await tx.$queryRaw(Prisma.sql`SELECT id FROM "Reservation" WHERE id = ${id} FOR UPDATE`);
  const reservation = await tx.reservation.findUnique({
    where: { id },
    select: { status: true, totalCents: true, expiresAt: true, stripePaymentIntentId: true },
  });
  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (reservation.status !== "HELD" || reservation.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Reservation is no longer active" }, { status: 409 });
  }

  // Lock discount resources in the same order as booking completion.
  if (parsed.data.giftVoucherCode) {
    parsed.data.giftVoucherCode = parsed.data.giftVoucherCode.trim().toUpperCase();
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "GiftVoucher" WHERE code = ${parsed.data.giftVoucherCode} FOR UPDATE`);
  }
  if (parsed.data.promoCodeId) await tx.$queryRaw(Prisma.sql`SELECT id FROM "PromoCode" WHERE id = ${parsed.data.promoCodeId} FOR UPDATE`);

  // Prices and discounts are always derived from persisted data, never client amounts.
  let promoDiscountCents = 0;
  let giftVoucherDiscountCents = 0;
  const now = new Date();
  if (parsed.data.promoCodeId) {
    const promo = await tx.promoCode.findUnique({ where: { id: parsed.data.promoCodeId } });
    const pendingUses = await tx.reservation.count({ where: {
      id: { not: id }, status: "HELD", expiresAt: { gt: now },
      contactSnapshot: { path: ["promoCodeId"], equals: parsed.data.promoCodeId },
    } });
    if (!promo || !promo.isActive || (promo.expiresAt && promo.expiresAt <= now) ||
        (promo.maxUses !== null && promo.usedCount + pendingUses >= promo.maxUses) || reservation.totalCents < promo.minSpendCents) {
      return NextResponse.json({ error: "This promo code is no longer available." }, { status: 409 });
    }
    promoDiscountCents = Math.max(0, Math.min(reservation.totalCents - 100,
      promo.type === "percentage" ? Math.round(reservation.totalCents * promo.value / 100) : promo.value));
  }
  if (parsed.data.giftVoucherCode) {
    parsed.data.giftVoucherCode = parsed.data.giftVoucherCode.trim().toUpperCase();
    const voucher = await tx.giftVoucher.findUnique({ where: { code: parsed.data.giftVoucherCode } });
    if (!voucher || !voucher.isActive || (voucher.expiresAt && voucher.expiresAt <= now) || voucher.balanceCents <= 0) {
      return NextResponse.json({ error: "This gift voucher is no longer available." }, { status: 409 });
    }
    const pending = await tx.reservation.findMany({ where: {
      id: { not: id }, status: "HELD", expiresAt: { gt: now },
      contactSnapshot: { path: ["giftVoucherCode"], equals: parsed.data.giftVoucherCode },
    }, select: { contactSnapshot: true } });
    const reserved = pending.reduce((sum, hold) => sum + Number((hold.contactSnapshot as Record<string, unknown>)?.giftVoucherDiscountCents ?? 0), 0);
    const available = Math.max(0, voucher.balanceCents - reserved);
    if (!available) return NextResponse.json({ error: "This voucher is being used in another checkout. Please try again shortly." }, { status: 409 });
    giftVoucherDiscountCents = Math.min(available, Math.max(0, reservation.totalCents - promoDiscountCents - 100));
  }
  const payableCents = reservation.totalCents - promoDiscountCents - giftVoucherDiscountCents;
  if (reservation.stripePaymentIntentId && isStripeConfigured()) {
    try {
      // Always update, including when a previously applied discount is removed.
      await getStripe().paymentIntents.update(reservation.stripePaymentIntentId, { amount: payableCents });
    } catch (e) {
      console.error("Payment amount update failed:", e);
      return NextResponse.json({ error: "Could not update payment. Please try again." }, { status: 502 });
    }
  }
  await tx.reservation.update({
    where: { id },
    data: { contactSnapshot: { ...parsed.data, promoDiscountCents, giftVoucherDiscountCents, payableCents } },
  });
  return NextResponse.json({ ok: true, payableCents, promoDiscountCents, giftVoucherDiscountCents });
  }, { timeout: 15000 });
}
