import { NextResponse } from "next/server";
import { expireStaleHolds } from "@/lib/availability";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  const url = new URL(req.url);
  return auth === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

// Mark stale holds EXPIRED and cancel their PaymentIntents. Run every few minutes.
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
