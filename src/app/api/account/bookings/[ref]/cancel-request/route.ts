import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import { getSiteSettings } from "@/lib/content";
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

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const site = await getSiteSettings();
    const resend = new Resend(apiKey);
    const hoursUntil = ((booking.session.startsAtUtc.getTime() - Date.now()) / (1000 * 60 * 60)).toFixed(1);
    await resend.emails.send({
      from: process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`,
      to: site.email,
      subject: `[Cancellation Request] ${booking.reference} — ${booking.session.tour.title}`,
      text:
        `A customer has requested cancellation.\n\n` +
        `Booking: ${booking.reference}\n` +
        `Tour: ${booking.session.tour.title}\n` +
        `Date: ${dateLabel(booking.session.startsAtUtc)} at ${timeLabel(booking.session.startsAtUtc)}\n` +
        `Hours until departure: ${hoursUntil}h\n` +
        `Customer: ${booking.customer.fullName} <${booking.customer.email}>\n` +
        `Phone: ${booking.customer.phone || "not provided"}\n` +
        (parsed.data.reason ? `\nReason: ${parsed.data.reason}\n` : "") +
        `\nProcess refund in admin: ${process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz"}/admin/bookings`,
    });
  } else {
    console.log("[cancel-request] (no RESEND_API_KEY) ref:", booking.reference);
  }

  return NextResponse.json({ ok: true });
}
