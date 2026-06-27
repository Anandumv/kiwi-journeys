import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

const schema = z.object({ notes: z.string().max(2000) });

export async function PUT(req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const session = await getCurrentCustomer();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ref } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const booking = await prisma.booking.findFirst({
    where: { reference: ref, customer: { email: session.email } },
    select: { id: true, status: true, session: { select: { startsAtUtc: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (booking.status !== "CONFIRMED") {
    return NextResponse.json({ error: "Only confirmed bookings can be updated." }, { status: 409 });
  }

  const hoursUntilDeparture = (booking.session.startsAtUtc.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilDeparture < 48) {
    return NextResponse.json({ error: "Notes cannot be changed within 48 hours of departure." }, { status: 409 });
  }

  await prisma.booking.update({ where: { id: booking.id }, data: { notes: parsed.data.notes } });
  return NextResponse.json({ ok: true });
}
