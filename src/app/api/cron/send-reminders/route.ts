import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueueUniqueEmails } from "@/lib/email-jobs";
import { getSiteSettings } from "@/lib/content";
import { dateLabel, timeLabel } from "@/lib/time";
import { cronAuthorized } from "@/lib/cron";

export const dynamic = "force-dynamic";

// Runs hourly over 4-hour windows, so a booking is seen by several runs. Email ids
// are per booking and kind, which makes every run after the first a no-op.
// 7-day window:  departures between now+6d22h and now+7d2h
// 24h window:    departures between now+22h and now+26h
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = Date.now();
  const H = 60 * 60 * 1000;
  const D = 24 * H;

  const [sevenDay, oneDay] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        session: {
          startsAtUtc: { gte: new Date(now + 7 * D - 2 * H), lt: new Date(now + 7 * D + 2 * H) },
        },
      },
      include: {
        customer: { select: { fullName: true, email: true } },
        session: { include: { tour: true } },
      },
    }),
    prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        session: {
          startsAtUtc: { gte: new Date(now + 22 * H), lt: new Date(now + 26 * H) },
        },
      },
      include: {
        customer: { select: { fullName: true, email: true } },
        session: { include: { tour: true } },
      },
    }),
  ]);

  const site = await getSiteSettings();
  // One reminder of each kind per booking, however often this runs.
  const queued = await enqueueUniqueEmails(prisma, [
    ...sevenDay.map((b) => ({
      id: `reminder-7d-${b.id}`,
      bookingReference: b.reference,
      to: b.customer.email,
      subject: `Your tour is in 7 days — ${b.session.tour.title}`,
      body: reminder7dText({ booking: b, siteName: site.name, sitePhone: site.phone }),
    })),
    ...oneDay.map((b) => ({
      id: `reminder-24h-${b.id}`,
      bookingReference: b.reference,
      to: b.customer.email,
      subject: `See you tomorrow! ${b.session.tour.title} — ${dateLabel(b.session.startsAtUtc)}`,
      body: reminder24hText({ booking: b, siteName: site.name, sitePhone: site.phone }),
    })),
  ]);

  return NextResponse.json({ sevenDay: sevenDay.length, oneDay: oneDay.length, queued });
}

type ReminderArgs = {
  booking: {
    reference: string;
    seats: number;
    customer: { fullName: string; email: string };
    session: { startsAtUtc: Date; tour: { title: string; pickup: string; importantInfo: string[] } };
  };
  siteName: string;
  sitePhone: string;
};

function reminder7dText({ booking: b, siteName, sitePhone }: ReminderArgs): string {
  const importantInfo = b.session.tour.importantInfo.length
    ? `\nImportant info:\n${b.session.tour.importantInfo.map((l) => `• ${l}`).join("\n")}\n`
    : "";
  return (
    `Hi ${b.customer.fullName},\n\n` +
    `Your ${b.session.tour.title} tour is coming up in 7 days!\n\n` +
    `Date: ${dateLabel(b.session.startsAtUtc)}\n` +
    `Departure: ${timeLabel(b.session.startsAtUtc)} NZ time\n` +
    (b.session.tour.pickup ? `Meeting point: ${b.session.tour.pickup}\n` : "") +
    `Guests: ${b.seats}\n` +
    `Reference: ${b.reference}\n` +
    `\nWhat to bring:\n` +
    `• Comfortable, weather-appropriate clothing and shoes\n` +
    `• Water and snacks for the day\n` +
    `• Camera\n` +
    `• Sunscreen and hat\n` +
    `• Any medications you may need\n` +
    importantInfo +
    `\nIf you have any questions, reply to this email or call us at ${sitePhone}.\n\n` +
    `We look forward to seeing you!\n${siteName}`
  );
}

function reminder24hText({ booking: b, siteName, sitePhone }: ReminderArgs): string {
  return (
    `Hi ${b.customer.fullName},\n\n` +
    `Your tour is TOMORROW — we can't wait to see you!\n\n` +
    `Tour: ${b.session.tour.title}\n` +
    `Date: ${dateLabel(b.session.startsAtUtc)}\n` +
    `Departure: ${timeLabel(b.session.startsAtUtc)} NZ time\n` +
    (b.session.tour.pickup ? `Meeting point: ${b.session.tour.pickup}\n` : "") +
    `Reference: ${b.reference}\n` +
    `\nPlease arrive 5–10 minutes before departure. ` +
    `If you have any last-minute questions, call us at ${sitePhone}.\n\n` +
    `See you tomorrow!\n${siteName}`
  );
}
