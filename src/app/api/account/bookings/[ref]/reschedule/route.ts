import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customerAuth";
import { remainingForSessions } from "@/lib/availability";
import { Resend } from "resend";
import { getSiteSettings } from "@/lib/content";
import { dateLabel, timeLabel } from "@/lib/time";

export const dynamic = "force-dynamic";

const schema = z.object({ newSessionId: z.string().min(1) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;
  const customerSession = await getCurrentCustomer();
  if (!customerSession) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { newSessionId } = parsed.data;
  const now = new Date();

  const booking = await prisma.booking.findFirst({
    where: { reference: ref, customer: { email: customerSession.email } },
    include: {
      session: { include: { tour: { select: { id: true, title: true, slug: true } } } },
      customer: { select: { fullName: true, email: true } },
    },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  if (booking.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: "Only confirmed bookings can be rescheduled." },
      { status: 409 },
    );
  }

  const hoursUntil =
    (booking.session.startsAtUtc.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntil < 48) {
    return NextResponse.json(
      { error: "Rescheduling closes 48 hours before departure." },
      { status: 409 },
    );
  }

  const newSession = await prisma.session.findUnique({
    where: { id: newSessionId },
    include: { tour: { select: { id: true } } },
  });
  if (!newSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  if (newSession.tourId !== booking.session.tourId) {
    return NextResponse.json(
      { error: "Cannot reschedule to a different tour." },
      { status: 400 },
    );
  }
  if (newSession.status !== "SCHEDULED" || newSession.startsAtUtc <= now) {
    return NextResponse.json(
      { error: "That departure is no longer available." },
      { status: 409 },
    );
  }
  if (newSessionId === booking.sessionId) {
    return NextResponse.json(
      { error: "That is already your current departure date." },
      { status: 400 },
    );
  }

  const remaining = await remainingForSessions([newSessionId], now);
  const seats = remaining.get(newSessionId) ?? 0;
  if (seats < booking.seats) {
    return NextResponse.json(
      { error: `Only ${seats} seat${seats === 1 ? "" : "s"} available on that date.` },
      { status: 409 },
    );
  }

  const oldSessionId = booking.sessionId;
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      sessionId: newSessionId,
      rescheduledFromSessionId: oldSessionId,
      rescheduledAt: now,
    },
  });

  // Email customer and admin.
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    const site = await getSiteSettings();
    const from = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
    const adminEmail =
      site.email || process.env.ADMIN_EMAIL || "admin@kiwiglobetours.co.nz";

    await Promise.all([
      resend.emails.send({
        from,
        to: booking.customer.email,
        subject: `Booking rescheduled: ${booking.session.tour.title} (${booking.reference})`,
        text:
          `Hi ${booking.customer.fullName.split(" ")[0]},\n\n` +
          `Your booking has been rescheduled.\n\n` +
          `Tour: ${booking.session.tour.title}\n` +
          `New date: ${dateLabel(newSession.startsAtUtc)}\n` +
          `New departure: ${timeLabel(newSession.startsAtUtc)} (NZ time)\n` +
          `Reference: ${booking.reference}\n\n` +
          `If you didn't request this change, contact us immediately at ${site.phone}.\n\n` +
          `${site.name}`,
      }),
      resend.emails.send({
        from,
        to: adminEmail,
        subject: `Booking rescheduled — ${booking.reference}`,
        text:
          `Customer rescheduled a booking.\n\n` +
          `Reference: ${booking.reference}\n` +
          `Customer: ${booking.customer.fullName} (${booking.customer.email})\n` +
          `Tour: ${booking.session.tour.title}\n` +
          `Old session ID: ${oldSessionId}\n` +
          `New date: ${dateLabel(newSession.startsAtUtc)} ${timeLabel(newSession.startsAtUtc)}\n`,
      }),
    ]).catch((e) => console.error("Reschedule emails failed:", e));
  }

  return NextResponse.json({
    ok: true,
    newDate: dateLabel(newSession.startsAtUtc),
    newTime: timeLabel(newSession.startsAtUtc),
  });
}
