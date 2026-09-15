import { BOOKING_VIEW_COOKIE, signBookingAccess, bookingCookieOptions } from "@/lib/bookingAccess";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Polled by the post-payment "processing" page until the webhook commits.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    select: { status: true, booking: { select: { reference: true } } },
  });
  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const response = NextResponse.json({
    status: reservation.status,
    reference: reservation.booking?.reference ?? null,
  });
  if (reservation.booking) response.cookies.set(BOOKING_VIEW_COOKIE, await signBookingAccess(reservation.booking.reference), bookingCookieOptions);
  return response;
}
