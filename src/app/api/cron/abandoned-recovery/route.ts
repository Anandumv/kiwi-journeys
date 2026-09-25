import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueueUniqueEmails } from "@/lib/email-jobs";
import { getSiteSettings } from "@/lib/content";
import { cronAuthorized } from "@/lib/cron";

export const dynamic = "force-dynamic";

// Run every 2 minutes via Vercel Cron (see vercel.json).
// Finds HELD reservations with contact info that are about to expire without
// payment and sends one recovery email per reservation.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const MIN = 60 * 1000;

  // HELD, has contactSnapshot, expires in 1–6 min from now (still active but nearly gone),
  // created at least 4 min ago (had time to see checkout), not already recovered.
  const candidates = await prisma.reservation.findMany({
    where: {
      status: "HELD",
      recoverySentAt: null,
      expiresAt: {
        gte: new Date(now.getTime() + 1 * MIN),
        lte: new Date(now.getTime() + 6 * MIN),
      },
      createdAt: { lte: new Date(now.getTime() - 4 * MIN) },
    },
    include: {
      session: { include: { tour: { select: { title: true, slug: true } } } },
    },
  });

  if (candidates.length === 0) return NextResponse.json({ checked: 0, sent: 0 });

  const site = await getSiteSettings();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";
  let sent = 0;

  for (const r of candidates) {
    const contact = r.contactSnapshot as { fullName?: string; email?: string } | null;
    // Claim and queue together: a crash or a concurrent run cannot send twice or lose the notice.
    const queued = await prisma.$transaction(async (tx) => {
      const claim = await tx.reservation.updateMany({ where: { id: r.id, recoverySentAt: null }, data: { recoverySentAt: now } });
      if (claim.count !== 1 || !contact?.email) return false;
      const firstName = contact.fullName?.split(" ")[0] || "there";
      await enqueueUniqueEmails(tx, [{
        id: `recovery-${r.id}`,
        bookingReference: r.id,
        to: contact.email,
        subject: `Your ${r.session.tour.title} seats are about to be released`,
        body:
          `Hi ${firstName},\n\n` +
          `You started booking the ${r.session.tour.title} but didn't quite finish.\n\n` +
          `Your seats are about to be released. If you'd still like to join us, complete your booking here:\n\n` +
          `${baseUrl}/checkout/${r.id}\n\n` +
          `If you no longer need these seats, no action is needed — they'll be released automatically.\n\n` +
          `Questions? Reply to this email or call us at ${site.phone}.\n\n` +
          `${site.name}`,
      }]);
      return true;
    });
    if (queued) sent++;
  }

  return NextResponse.json({ checked: candidates.length, sent });
}
