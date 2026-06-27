import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ surveyed: 0, pending: pending.length, note: "No RESEND_API_KEY" });

  const resend = new Resend(apiKey);
  const site = await getSiteSettings();
  const from = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";
  let sent = 0;

  for (const b of pending) {
    const surveyUrl = `${baseUrl}/survey/${b.reference}`;
    await resend.emails.send({
      from,
      to: b.customer.email,
      subject: `How was your ${b.session.tour.title} tour? — ${site.name}`,
      text:
        `Hi ${b.customer.fullName},\n\n` +
        `We hope you had an amazing day on your ${b.session.tour.title} tour on ${dateLabel(b.session.startsAtUtc)}!\n\n` +
        `We would love to hear your feedback — it takes less than a minute and helps us improve for future guests:\n\n` +
        `${surveyUrl}\n\n` +
        `Your honest feedback means a great deal to us.\n\n` +
        `Thank you for choosing ${site.name}!\n${site.phone}`,
    }).catch((e) => console.error(`Survey email failed ${b.reference}:`, e));
    sent++;
  }

  return NextResponse.json({ pending: pending.length, sent });
}
