import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueueUniqueEmails } from "@/lib/email-jobs";
import { getSiteSettings } from "@/lib/content";
import { dateLabel } from "@/lib/time";
import { cronAuthorized } from "@/lib/cron";

export const dynamic = "force-dynamic";

// Run daily. Finds CONFIRMED tours that ended 1–3 days ago with no survey yet.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = Date.now();
  const D = 24 * 60 * 60 * 1000;

  // Tours that departed 1–3 days ago.
  const eligible = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      session: {
        startsAtUtc: { gte: new Date(now - 3 * D), lt: new Date(now - 1 * D) },
      },
    },
    include: {
      customer: { select: { fullName: true, email: true } },
      session: { include: { tour: { select: { title: true } } } },
    },
  });

  if (eligible.length === 0) return NextResponse.json({ surveyed: 0 });

  // Filter out bookings that already have a survey response.
  const ids = eligible.map((b) => b.id);
  const surveyed = await prisma.surveyResponse.findMany({
    where: { bookingId: { in: ids } },
    select: { bookingId: true },
  });
  const surveyedSet = new Set(surveyed.map((s) => s.bookingId));
  const pending = eligible.filter((b) => !surveyedSet.has(b.id));

  if (pending.length === 0) return NextResponse.json({ surveyed: 0, note: "all already surveyed" });

  const site = await getSiteSettings();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";
  // The eligibility window spans two daily runs; the per-booking id sends one survey.
  const queued = await enqueueUniqueEmails(prisma, pending.map((b) => ({
    id: `survey-${b.id}`,
    bookingReference: b.reference,
    to: b.customer.email,
    subject: `How was your ${b.session.tour.title} tour? — ${site.name}`,
    body:
      `Hi ${b.customer.fullName},\n\n` +
      `We hope you had a great day on your ${b.session.tour.title} tour on ${dateLabel(b.session.startsAtUtc)}.\n\n` +
      `We would love to hear your feedback. It takes less than a minute and helps us improve for future guests:\n\n` +
      `${baseUrl}/survey/${b.reference}\n\n` +
      `Thank you for choosing ${site.name}.\n${site.phone}`,
  })));

  return NextResponse.json({ pending: pending.length, queued });
}
