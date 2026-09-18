import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customerAuth";
import { SoldOutError } from "@/lib/availability";
import { rescheduleBooking } from "@/lib/reschedule";
import { getSiteSettings } from "@/lib/content";
import { enqueueEmails } from "@/lib/email-jobs";
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

  const oldSessionId = booking.sessionId;
  try {
    await rescheduleBooking(booking.id, newSessionId, customerSession.email, now);
  } catch (error) {
    const message = error instanceof SoldOutError
      ? `Only ${error.available} seats available on that date.`
      : "Booking or departure changed. Please refresh and try again.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  // Queued, not sent inline: a Resend outage must not silently lose the
  // customer's only notice that their departure date moved.
  const site = await getSiteSettings();
  const adminEmail = site.email || process.env.ADMIN_EMAIL || "admin@kiwiglobetours.co.nz";
  await enqueueEmails(prisma, "reschedule", [
    {
      to: booking.customer.email,
      bookingReference: booking.reference,
      subject: `Booking rescheduled: ${booking.session.tour.title} (${booking.reference})`,
      body:
        `Hi ${booking.customer.fullName.split(" ")[0]},\n\n` +
        `Your booking has been rescheduled.\n\n` +
        `Tour: ${booking.session.tour.title}\n` +
        `New date: ${dateLabel(newSession.startsAtUtc)}\n` +
        `New departure: ${timeLabel(newSession.startsAtUtc)} (NZ time)\n` +
        `Reference: ${booking.reference}\n\n` +
        `If you didn't request this change, contact us immediately at ${site.phone}.\n\n` +
        `${site.name}`,
    },
    {
      to: adminEmail,
      bookingReference: booking.reference,
      subject: `Booking rescheduled — ${booking.reference}`,
      body:
        `Customer rescheduled a booking.\n\n` +
        `Reference: ${booking.reference}\n` +
        `Customer: ${booking.customer.fullName} (${booking.customer.email})\n` +
        `Tour: ${booking.session.tour.title}\n` +
        `Old session ID: ${oldSessionId}\n` +
        `New date: ${dateLabel(newSession.startsAtUtc)} ${timeLabel(newSession.startsAtUtc)}\n`,
    },
  ]);

  return NextResponse.json({
    ok: true,
    newDate: dateLabel(newSession.startsAtUtc),
    newTime: timeLabel(newSession.startsAtUtc),
  });
}
