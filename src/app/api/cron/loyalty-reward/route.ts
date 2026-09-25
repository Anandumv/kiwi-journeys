import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueueUniqueEmails } from "@/lib/email-jobs";
import { getSiteSettings } from "@/lib/content";
import { cronAuthorized } from "@/lib/cron";
import { randomCode as randomSuffix } from "@/lib/codes";

export const dynamic = "force-dynamic";


// Run daily. Rewards customers who completed their 2nd+ tour 2–4 days ago
// with a personal 10%-off promo code valid for 60 days.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const D = 24 * 60 * 60 * 1000;

  // Find customer IDs whose most recent confirmed booking ended 2–4 days ago.
  const recentlyFinished = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      session: {
        startsAtUtc: {
          gte: new Date(now.getTime() - 4 * D),
          lt: new Date(now.getTime() - 2 * D),
        },
      },
    },
    select: { customerId: true },
    distinct: ["customerId"],
  });

  if (recentlyFinished.length === 0) return NextResponse.json({ rewarded: 0 });

  const customerIds = recentlyFinished.map((b) => b.customerId);
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds }, loyaltyEmailSentAt: null },
    select: {
      id: true,
      fullName: true,
      email: true,
      _count: { select: { bookings: true } },
    },
  });

  // Only customers with 2+ total confirmed bookings.
  const eligible = customers.filter((c) => c._count.bookings >= 2);
  if (eligible.length === 0) return NextResponse.json({ rewarded: 0, note: "none qualified" });

  const site = await getSiteSettings();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";
  const expiresAt = new Date(now.getTime() + 60 * D);
  let rewarded = 0;

  for (const customer of eligible) {
    const code = `RETURN${randomSuffix(6)}`;
    // Claim, create the code and queue its email atomically: no lost or duplicate rewards.
    const issued = await prisma.$transaction(async (tx) => {
      const claim = await tx.customer.updateMany({ where: { id: customer.id, loyaltyEmailSentAt: null }, data: { loyaltyEmailSentAt: now } });
      if (claim.count !== 1) return false;
      await tx.promoCode.create({
        data: {
          code,
          description: `Loyalty reward — returning guest ${customer.email}`,
          type: "percentage",
          value: 10,
          maxUses: 1,
          expiresAt,
          isActive: true,
        },
      });
      await enqueueUniqueEmails(tx, [{
        id: `loyalty-${customer.id}`,
        bookingReference: `LOYALTY-${customer.id}`,
        to: customer.email,
        subject: `A little thank-you from ${site.name} — 10% off your next day out`,
        body:
          `Hi ${customer.fullName.split(" ")[0]},\n\n` +
          `Thank you for travelling with us again.\n\n` +
          `As a returning guest, here's a personal 10% discount for your next booking:\n\n` +
          `  Promo code: ${code}\n` +
          `  Valid until: ${expiresAt.toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}\n\n` +
          `Enter the code at checkout on any of our South Island day tours:\n` +
          `${baseUrl}/tours\n\n` +
          `We hope to see you again soon.\n${site.name}\n${site.phone}`,
      }]);
      return true;
    });
    if (issued) rewarded++;
  }

  return NextResponse.json({ eligible: eligible.length, rewarded });
}
