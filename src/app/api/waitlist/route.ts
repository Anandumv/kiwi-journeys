import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  tourId: z.string().min(1),
  sessionId: z.string().optional(),
  email: z.string().email(),
  fullName: z.string().min(1).max(200),
  phone: z.string().max(50).optional().or(z.literal("")),
  seats: z.number().int().min(1).max(20).default(1),
});

export async function POST(req: Request) {
  const { allowed } = rateLimit(rateLimitKey(req, "waitlist"), { limit: 3, windowMs: 60 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const { tourId, sessionId, email, fullName, phone, seats } = parsed.data;

  const tour = await prisma.tour.findUnique({ where: { id: tourId, isActive: true }, select: { title: true } });
  if (!tour) return NextResponse.json({ error: "Tour not found." }, { status: 404 });

  await prisma.waitlist.create({
    data: {
      tourId,
      sessionId: sessionId || null,
      email: email.toLowerCase(),
      fullName,
      phone: phone || null,
      seats,
      tourTitle: tour.title,
    },
  });

  return NextResponse.json({ ok: true });
}
