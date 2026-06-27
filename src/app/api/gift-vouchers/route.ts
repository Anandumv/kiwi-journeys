import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSiteSettings } from "@/lib/content";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeVoucherCode(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `GV-${s}`;
}

const schema = z.object({
  amountCents: z.number().int().min(5000).max(200000),
  purchaserName: z.string().min(1).max(200),
  purchaserEmail: z.string().email(),
  recipientName: z.string().max(200).optional().or(z.literal("")),
  recipientEmail: z.string().email().optional().or(z.literal("")),
  message: z.string().max(500).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const { allowed } = rateLimit(rateLimitKey(req, "gift-voucher"), {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const d = parsed.data;
  const code = makeVoucherCode();

  const voucher = await prisma.giftVoucher.create({
    data: {
      code,
      amountCents: d.amountCents,
      balanceCents: d.amountCents,
      purchaserName: d.purchaserName,
      purchaserEmail: d.purchaserEmail,
      recipientName: d.recipientName || null,
      recipientEmail: d.recipientEmail || null,
      message: d.message || null,
      isActive: false,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  if (!isStripeConfigured()) {
    return NextResponse.json({
      voucherId: voucher.id,
      clientSecret: null,
      stripeConfigured: false,
    });
  }

  try {
    const stripe = getStripe();
    const site = await getSiteSettings();
    const pi = await stripe.paymentIntents.create({
      amount: d.amountCents,
      currency: "nzd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        giftVoucher: "true",
        giftVoucherId: voucher.id,
        voucherCode: code,
      },
      description: `${site.name} — Gift Voucher ${code}`,
    });

    await prisma.giftVoucher.update({
      where: { id: voucher.id },
      data: { stripePaymentIntentId: pi.id },
    });

    return NextResponse.json({
      voucherId: voucher.id,
      voucherCode: code,
      clientSecret: pi.client_secret,
      stripeConfigured: true,
    });
  } catch (e) {
    console.error("Gift voucher Stripe PI failed:", e);
    await prisma.giftVoucher.delete({ where: { id: voucher.id } });
    return NextResponse.json({ error: "Payment setup failed" }, { status: 502 });
  }
}
