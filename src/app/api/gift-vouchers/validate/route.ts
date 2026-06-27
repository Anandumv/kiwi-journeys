import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { allowed } = rateLimit(rateLimitKey(req, "gv-validate"), {
    limit: 10,
    windowMs: 60 * 1000,
  });
  if (!allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "").trim().toUpperCase();
  const totalCents: number = Number(body.totalCents) || 0;

  if (!code) {
    return NextResponse.json({ valid: false, message: "No code provided." }, { status: 400 });
  }

  const voucher = await prisma.giftVoucher.findUnique({ where: { code } });

  if (!voucher || !voucher.isActive) {
    return NextResponse.json({ valid: false, message: "Invalid or inactive gift voucher." });
  }
  if (voucher.expiresAt && voucher.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, message: "This gift voucher has expired." });
  }
  if (voucher.balanceCents <= 0) {
    return NextResponse.json({ valid: false, message: "This gift voucher has no remaining balance." });
  }

  // Keep at least NZD $1 (100 cents) charged via Stripe — zero-charge flow not supported.
  const maxDiscount = Math.max(0, totalCents - 100);
  const discountCents = Math.min(voucher.balanceCents, maxDiscount);
  const balanceNZD = (voucher.balanceCents / 100).toFixed(2);

  return NextResponse.json({
    valid: true,
    voucherId: voucher.id,
    voucherCode: voucher.code,
    balanceCents: voucher.balanceCents,
    discountCents,
    message: `Gift voucher applied — NZD ${(discountCents / 100).toFixed(2)} off (remaining balance: NZD ${balanceNZD})`,
  });
}
