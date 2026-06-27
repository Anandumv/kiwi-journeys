import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/content";

export const dynamic = "force-dynamic";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  wouldReturn: z.boolean().default(true),
  feedback: z.string().max(5000).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { reference: ref },
    include: { customer: { select: { fullName: true, email: true } }, session: { include: { tour: { select: { title: true } } } } },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  // Idempotent — silently succeed if already submitted.
  const existing = await prisma.surveyResponse.findUnique({ where: { bookingId: booking.id } });
  if (existing) return NextResponse.json({ ok: true, already: true });

  await prisma.surveyResponse.create({
    data: {
      bookingId: booking.id,
      rating: parsed.data.rating,
      wouldReturn: parsed.data.wouldReturn,
      feedback: parsed.data.feedback || null,
    },
  });

  // 5-star → send a review request.
  if (parsed.data.rating >= 5) {
    void sendReviewRequest(booking).catch((e) => console.error("Review request failed:", e));
  }

  return NextResponse.json({ ok: true });
}

async function sendReviewRequest(booking: {
  reference: string;
  customer: { fullName: string; email: string };
  session: { tour: { title: string } };
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const site = await getSiteSettings();
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`,
    to: booking.customer.email,
    subject: `Loved your ${booking.session.tour.title} tour? Share your experience!`,
    text:
      `Hi ${booking.customer.fullName},\n\n` +
      `We're so glad you had a wonderful time on your ${booking.session.tour.title} tour!\n\n` +
      `Would you mind leaving us a quick review? It takes just 2 minutes and helps other ` +
      `travellers discover us:\n\n` +
      (process.env.GOOGLE_REVIEW_URL ? `Google: ${process.env.GOOGLE_REVIEW_URL}\n` : "") +
      (process.env.TRIPADVISOR_URL ? `TripAdvisor: ${process.env.TRIPADVISOR_URL}\n` : "") +
      `\nThank you — reviews mean the world to a small operator like us.\n\n` +
      `${site.name}`,
  });
}
