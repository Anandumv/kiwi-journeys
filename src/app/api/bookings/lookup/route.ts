import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  reference: z.string().min(1).max(20),
});

export async function POST(req: Request) {
  const { allowed } = rateLimit(rateLimitKey(req, "booking-lookup"), { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Too many attempts. Please try again in 15 minutes." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const { email, reference } = parsed.data;

  const booking = await prisma.booking.findFirst({
    where: {
      reference: { equals: reference.trim().toUpperCase() },
      customer: { email: { equals: email.trim().toLowerCase(), mode: "insensitive" } },
    },
    select: {
      reference: true,
      status: true,
      seats: true,
      totalCents: true,
      createdAt: true,
      session: {
        select: {
          startsAtUtc: true,
          tour: { select: { title: true, slug: true } },
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "No booking found with those details. Check your email and reference number." }, { status: 404 });
  }

  return NextResponse.json({
    reference: booking.reference,
    status: booking.status,
    seats: booking.seats,
    totalCents: booking.totalCents,
    tourTitle: booking.session.tour.title,
    tourSlug: booking.session.tour.slug,
    startsAtUtc: booking.session.startsAtUtc.toISOString(),
    createdAt: booking.createdAt.toISOString(),
  });
}
