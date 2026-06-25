import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "").trim().toUpperCase();
  const totalCents: number = Number(body.totalCents) || 0;

  if (!code) {
    return NextResponse.json({ valid: false, message: "No code provided." }, { status: 400 });
  }

  const promo = await prisma.promoCode.findUnique({ where: { code } });

  if (!promo || !promo.isActive) {
    return NextResponse.json({ valid: false, message: "Invalid or inactive promo code." });
  }
  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, message: "This promo code has expired." });
  }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return NextResponse.json({ valid: false, message: "This promo code has reached its usage limit." });
  }
  if (promo.minSpendCents > 0 && totalCents < promo.minSpendCents) {
    const minNZD = (promo.minSpendCents / 100).toFixed(2);
    return NextResponse.json({ valid: false, message: `Minimum spend of NZD ${minNZD} required.` });
  }

  let discountCents: number;
  if (promo.type === "percentage") {
    discountCents = Math.round((totalCents * promo.value) / 100);
  } else {
    discountCents = Math.min(promo.value, totalCents);
  }

  return NextResponse.json({
    valid: true,
    discountCents,
    promoId: promo.id,
    message: `Code applied: ${promo.type === "percentage" ? `${promo.value}% off` : `NZD ${(discountCents / 100).toFixed(2)} off`}`,
  });
}
