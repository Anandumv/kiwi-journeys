import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/content";
import { dateLabel, timeLabel } from "@/lib/time";
import { cronAuthorized } from "@/lib/cron";
import { enqueueEmails } from "@/lib/email-jobs";

export const dynamic = "force-dynamic";

// Run hourly. For each unnotified waitlist entry, check if their session (or any
// session for their tour) has available seats. If yes, claim the entry and queue
// its email in one transaction; deliver-emails sends it with retries and an
// idempotency key, so a crash can neither lose nor duplicate the notice, and a
// concurrent run cannot claim the same entry twice.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await prisma.waitlist.findMany({
    where: { notified: false },
    orderBy: { createdAt: "asc" },
  });

  if (entries.length === 0) return NextResponse.json({ notified: 0 });

  const site = await getSiteSettings();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";
  let notified = 0;
  const now = new Date();
  const inventory = {
    bookings: { where: { status: "CONFIRMED" as const }, select: { seats: true } },
    reservations: { where: { status: "HELD" as const, expiresAt: { gt: now } }, select: { seats: true } },
  };

  for (const entry of entries) {
    let hasAvailability = false;
    let sessionInfo: { startsAtUtc: Date; tourSlug: string } | null = null;

    if (entry.sessionId) {
      // Check specific session availability.
      const session = await prisma.session.findUnique({
        where: { id: entry.sessionId },
        include: { tour: { select: { slug: true, isActive: true } }, ...inventory },
      });
      if (session && session.tourId === entry.tourId && session.tour.isActive && session.status === "SCHEDULED" && session.startsAtUtc > now) {
        const usedSeats = session.bookings.reduce((sum, b) => sum + b.seats, 0) + session.reservations.reduce((sum, r) => sum + r.seats, 0);
        if (session.capacity - usedSeats >= entry.seats) {
          hasAvailability = true;
          sessionInfo = { startsAtUtc: session.startsAtUtc, tourSlug: session.tour.slug };
        }
      }
    } else {
      // Tour-level waitlist: check if any future session for this tour has capacity.
      const tour = await prisma.tour.findUnique({
        where: { id: entry.tourId, isActive: true },
        include: {
          sessions: {
            where: { status: "SCHEDULED", startsAtUtc: { gt: new Date() } },
            include: inventory,
            orderBy: { startsAtUtc: "asc" },
          },
        },
      });
      if (tour) {
        const available = tour.sessions.find((s) => {
          const used = s.bookings.reduce((sum, b) => sum + b.seats, 0) + s.reservations.reduce((sum, r) => sum + r.seats, 0);
          return s.capacity - used >= entry.seats;
        });
        if (available) {
          hasAvailability = true;
          sessionInfo = { startsAtUtc: available.startsAtUtc, tourSlug: tour.slug };
        }
      }
    }

    if (!hasAvailability) continue;

    const bookUrl = sessionInfo
      ? `${baseUrl}/tours/${sessionInfo.tourSlug}/book`
      : `${baseUrl}/tours`;

    const body =
      `Hi ${entry.fullName},\n\n` +
      `A spot has opened up on ${entry.tourTitle}.\n\n` +
      (sessionInfo
        ? `Available date: ${dateLabel(sessionInfo.startsAtUtc)} at ${timeLabel(sessionInfo.startsAtUtc)} NZ time\n\n`
        : "") +
      `Book here before it fills up again:\n${bookUrl}\n\n` +
      `Seats go to whoever books first.\n\n` +
      `${site.name}\n${site.phone}`;

    const queued = await prisma.$transaction(async (tx) => {
      const claim = await tx.waitlist.updateMany({ where: { id: entry.id, notified: false }, data: { notified: true } });
      if (claim.count !== 1) return false;
      await enqueueEmails(tx, "waitlist", [{
        to: entry.email,
        subject: `A spot opened up on ${entry.tourTitle} — ${site.name}`,
        body,
        bookingReference: `WAITLIST-${entry.id}`,
      }]);
      return true;
    });
    if (!queued) continue;
    notified++;
  }

  return NextResponse.json({ checked: entries.length, notified });
}
