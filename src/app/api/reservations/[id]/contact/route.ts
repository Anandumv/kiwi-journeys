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

type Failure = { error: string; status: number };
const isFailure = (v: unknown): v is Failure =>
  typeof v === "object" && v !== null && "error" in v && "status" in v;

// Save passenger/contact details onto the reservation before payment confirms.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const input = { ...parsed.data };
  if (input.giftVoucherCode) input.giftVoucherCode = input.giftVoucherCode.trim().toUpperCase();

  // Phase 1 — short, row-locked transaction. Prices and discounts are always
  // derived from persisted data, never from client amounts. No network calls
  // happen while these locks are held: a Stripe round-trip inside the
  // transaction would pin a pooled connection and the Reservation, GiftVoucher
  // and PromoCode rows for the duration of an external request.
  const outcome = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw(Prisma.sql`SELECT id FROM "Reservation" WHERE id = ${id} FOR UPDATE`);
    const reservation = await tx.reservation.findUnique({
      where: { id },
      select: { status: true, totalCents: true, expiresAt: true, stripePaymentIntentId: true },
    });
    if (!reservation) return { error: "Not found", status: 404 } satisfies Failure;
    if (reservation.status !== "HELD" || reservation.expiresAt <= new Date()) {
      return { error: "Reservation is no longer active", status: 409 } satisfies Failure;
    }

    // Lock discount resources in the same order as booking completion.
    if (input.giftVoucherCode) {
      await tx.$queryRaw(Prisma.sql`SELECT id FROM "GiftVoucher" WHERE code = ${input.giftVoucherCode} FOR UPDATE`);
    }
    if (input.promoCodeId) {
      await tx.$queryRaw(Prisma.sql`SELECT id FROM "PromoCode" WHERE id = ${input.promoCodeId} FOR UPDATE`);
    }

    let promoDiscountCents = 0;
    let giftVoucherDiscountCents = 0;
    const now = new Date();

    if (input.promoCodeId) {
      const promo = await tx.promoCode.findUnique({ where: { id: input.promoCodeId } });
      const pendingUses = await tx.reservation.count({ where: {
        id: { not: id }, status: "HELD", expiresAt: { gt: now },
        contactSnapshot: { path: ["promoCodeId"], equals: input.promoCodeId },
      } });
      if (!promo || !promo.isActive || (promo.expiresAt && promo.expiresAt <= now) ||
          (promo.maxUses !== null && promo.usedCount + pendingUses >= promo.maxUses) ||
          reservation.totalCents < promo.minSpendCents) {
        return { error: "This promo code is no longer available.", status: 409 } satisfies Failure;
      }
      promoDiscountCents = Math.max(0, Math.min(reservation.totalCents - 100,
        promo.type === "percentage" ? Math.round(reservation.totalCents * promo.value / 100) : promo.value));
    }

    if (input.giftVoucherCode) {
      const voucher = await tx.giftVoucher.findUnique({ where: { code: input.giftVoucherCode } });
      if (!voucher || !voucher.isActive || (voucher.expiresAt && voucher.expiresAt <= now) || voucher.balanceCents <= 0) {
        return { error: "This gift voucher is no longer available.", status: 409 } satisfies Failure;
      }
      const pending = await tx.reservation.findMany({ where: {
        id: { not: id }, status: "HELD", expiresAt: { gt: now },
        contactSnapshot: { path: ["giftVoucherCode"], equals: input.giftVoucherCode },
      }, select: { contactSnapshot: true } });
      const reserved = pending.reduce((sum, hold) =>
        sum + Number((hold.contactSnapshot as Record<string, unknown>)?.giftVoucherDiscountCents ?? 0), 0);
      const available = Math.max(0, voucher.balanceCents - reserved);
      if (!available) {
        return { error: "This voucher is being used in another checkout. Please try again shortly.", status: 409 } satisfies Failure;
      }
      giftVoucherDiscountCents = Math.min(available, Math.max(0, reservation.totalCents - promoDiscountCents - 100));
    }

    const payableCents = reservation.totalCents - promoDiscountCents - giftVoucherDiscountCents;
    await tx.reservation.update({
      where: { id },
      data: { contactSnapshot: { ...input, promoDiscountCents, giftVoucherDiscountCents, payableCents } },
    });
    return { payableCents, promoDiscountCents, giftVoucherDiscountCents,
      paymentIntentId: reservation.stripePaymentIntentId };
  });

  if (isFailure(outcome)) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  }

  // Phase 2 — no locks held. Always update, including when a previously applied
  // discount is removed. A failure here leaves the stored payableCents ahead of
  // the intent's amount, so we refuse rather than let the customer pay: the
  // webhook rejects any amount that disagrees with payableCents. Retrying this
  // request recomputes the same figures and retries the update.
  if (outcome.paymentIntentId && isStripeConfigured()) {
    try {
      await getStripe().paymentIntents.update(outcome.paymentIntentId, { amount: outcome.payableCents });
    } catch (e) {
      console.error("Payment amount update failed:", e);
      return NextResponse.json({ error: "Could not update payment. Please try again." }, { status: 502 });
    }
  }

  return NextResponse.json({
    ok: true,
    payableCents: outcome.payableCents,
    promoDiscountCents: outcome.promoDiscountCents,
    giftVoucherDiscountCents: outcome.giftVoucherDiscountCents,
  });
}
