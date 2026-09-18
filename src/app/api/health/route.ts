import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Railway health check. Only an unreachable database is fatal — a missing
 * Stripe or Resend key leaves the site up but unable to sell or notify, so it
 * is reported rather than failing the deploy (which would remove the very
 * instance an operator needs in order to fix the settings).
 */
export async function GET() {
  const checks = {
    payments: isStripeConfigured(),
    webhook: !!process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET !== "whsec_xxx",
    email: !!process.env.RESEND_API_KEY,
    scheduler: process.env.ENABLE_INTERNAL_CRON === "true" && !!process.env.CRON_SECRET,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    return NextResponse.json({ status: "degraded", db: "unreachable", ...checks }, { status: 503 });
  }

  const canSell = checks.payments && checks.webhook;
  return NextResponse.json({
    status: canSell ? "ok" : "ok-degraded",
    db: "ok",
    ...checks,
    ...(canSell ? {} : { note: "Bookings cannot be taken until Stripe keys are configured." }),
  });
}
