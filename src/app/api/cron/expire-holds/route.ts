import { NextResponse } from "next/server";
import { expireStaleHolds } from "@/lib/availability";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { cronAuthorized } from "@/lib/cron";

export const dynamic = "force-dynamic";

// Mark stale holds EXPIRED and cancel their PaymentIntents. Run every few minutes.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const piIds = await expireStaleHolds();
  let cancelled = 0;
  if (isStripeConfigured()) {
    const stripe = getStripe();
    for (const pi of piIds) {
      try {
        await stripe.paymentIntents.cancel(pi);
        cancelled++;
      } catch {
        /* already captured/cancelled — ignore */
      }
    }
  }
  return NextResponse.json({ expired: piIds.length, cancelledIntents: cancelled });
}
