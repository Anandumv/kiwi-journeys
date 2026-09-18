import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/content";
import { enqueueEmails } from "@/lib/email-jobs";
import { getCurrentCustomer } from "@/lib/customerAuth";
import { dateLabel, timeLabel } from "@/lib/time";

export const dynamic = "force-dynamic";

const schema = z.object({ reason: z.string().max(1000).optional() });

export async function POST(req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const session = await getCurrentCustomer();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ref } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const booking = await prisma.booking.findFirst({
    where: { reference: ref, customer: { email: session.email } },
    select: {
      id: true,
      reference: true,
      status: true,
      totalCents: true,
      session: { select: { startsAtUtc: true, tour: { select: { title: true } } } },
      customer: { select: { fullName: true, email: true, phone: true } },
    },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (booking.status !== "CONFIRMED") {
    return NextResponse.json({ error: "Only confirmed bookings can be cancelled." }, { status: 409 });
  }

  // Queued for durable delivery: if this notice is lost the customer believes
  // they have cancelled and nobody on the team ever sees the request.
  const site = await getSiteSettings();
  const hoursUntil = ((booking.session.startsAtUtc.getTime() - Date.now()) / (1000 * 60 * 60)).toFixed(1);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";
  await enqueueEmails(prisma, "cancel-request", [
    {
      to: site.email,
      bookingReference: booking.reference,
      subject: `[Cancellation Request] ${booking.reference} — ${booking.session.tour.title}`,
      body:
        `A customer has requested cancellation.\n\n` +
        `Booking: ${booking.reference}\n` +
        `Tour: ${booking.session.tour.title}\n` +
        `Date: ${dateLabel(booking.session.startsAtUtc)} at ${timeLabel(booking.session.startsAtUtc)}\n` +
        `Hours until departure: ${hoursUntil}h\n` +
        `Customer: ${booking.customer.fullName} <${booking.customer.email}>\n` +
        `Phone: ${booking.customer.phone || "not provided"}\n` +
        (parsed.data.reason ? `\nReason: ${parsed.data.reason}\n` : "") +
        `\nProcess refund in admin: ${baseUrl}/admin/bookings`,
    },
    {
      to: booking.customer.email,
      bookingReference: booking.reference,
      subject: `Cancellation request received — ${booking.reference}`,
      body:
        `Hi ${booking.customer.fullName.split(" ")[0]},\n\n` +
        `We've received your cancellation request for:\n\n` +
        `  Tour: ${booking.session.tour.title}\n` +
        `  Date: ${dateLabel(booking.session.startsAtUtc)} at ${timeLabel(booking.session.startsAtUtc)}\n` +
        `  Reference: ${booking.reference}\n\n` +
        `Our team will review your request and contact you within 24 hours to confirm.\n` +
        `If you need to speak with us urgently, please call ${site.phone}.\n\n` +
        `${site.name}`,
    },
  ]);

  return NextResponse.json({ ok: true });
}
