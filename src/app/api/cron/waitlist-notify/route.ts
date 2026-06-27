import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/content";
import { dateLabel, timeLabel } from "@/lib/time";
import { cronAuthorized } from "@/lib/cron";

export const dynamic = "force-dynamic";

// Run hourly. For each unnotified waitlist entry, check if their session (or any
// session for their tour) has available seats. If yes, email and mark notified.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await prisma.waitlist.findMany({
    where: { notified: false },
    orderBy: { createdAt: "asc" },
  });

  if (entries.length === 0) return NextResponse.json({ notified: 0 });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ pending: entries.length, note: "No RESEND_API_KEY" });

  const resend = new Resend(apiKey);
  const site = await getSiteSettings();
  const from = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";
  let notified = 0;

  for (const entry of entries) {
    let hasAvailability = false;
    let sessionInfo: { startsAtUtc: Date; tourSlug: string } | null = null;

    if (entry.sessionId) {
      // Check specific session availability.
      const session = await prisma.session.findUnique({
        where: { id: entry.sessionId },
        include: { tour: { select: { slug: true } }, bookings: { where: { status: "CONFIRMED" }, select: { seats: true } } },
      });
      if (session && session.status === "SCHEDULED" && session.startsAtUtc > new Date()) {
        const usedSeats = session.bookings.reduce((sum, b) => sum + b.seats, 0);
        if (session.capacity - usedSeats >= entry.seats) {
          hasAvailability = true;
          sessionInfo = { startsAtUtc: session.startsAtUtc, tourSlug: session.tour.slug };
        }
      }
    } else {
      // Tour-level waitlist: check if any future session for this tour has capacity.
      const tour = await prisma.tour.findUnique({
        where: { id: entry.tourId },
        include: {
          sessions: {
            where: { status: "SCHEDULED", startsAtUtc: { gt: new Date() } },
            include: { bookings: { where: { status: "CONFIRMED" }, select: { seats: true } } },
            orderBy: { startsAtUtc: "asc" },
          },
        },
      });
      if (tour) {
        const available = tour.sessions.find((s) => {
          const used = s.bookings.reduce((sum, b) => sum + b.seats, 0);
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

    await resend.emails.send({
      from,
      to: entry.email,
      subject: `Good news! A spot opened up on ${entry.tourTitle} — ${site.name}`,
      text:
        `Hi ${entry.fullName},\n\n` +
        `Great news — a spot has opened up on ${entry.tourTitle}!\n\n` +
        (sessionInfo
          ? `Available date: ${dateLabel(sessionInfo.startsAtUtc)} at ${timeLabel(sessionInfo.startsAtUtc)} NZ time\n\n`
          : "") +
        `Book now before it fills up again:\n${bookUrl}\n\n` +
        `Seats are limited — first come, first served.\n\n` +
        `${site.name}\n${site.phone}`,
    }).catch((e) => console.error(`Waitlist email failed ${entry.id}:`, e));

    await prisma.waitlist.update({ where: { id: entry.id }, data: { notified: true } });
    notified++;
  }

  return NextResponse.json({ checked: entries.length, notified });
}
