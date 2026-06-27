import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import { getSiteSettings } from "@/lib/content";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { allowed } = rateLimit(rateLimitKey(req, "newsletter"), { limit: 3, windowMs: 60 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email }, select: { id: true } });
  await prisma.newsletterSubscriber.upsert({ where: { email }, create: { email }, update: {} });

  // Send welcome email only on first signup (not on re-subscribe).
  if (!existing) {
    void sendWelcomeEmail(email).catch((e) => console.error("Welcome email failed:", e));
  }

  return NextResponse.json({ ok: true });
}

async function sendWelcomeEmail(to: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const site = await getSiteSettings();
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`,
    to,
    subject: `Welcome to ${site.name} — your South Island adventure starts here`,
    text:
      `Hi there,\n\n` +
      `Thanks for subscribing! You're now on the ${site.name} list for travel inspiration, ` +
      `early-bird deals, and seasonal tour news.\n\n` +
      `Browse our tours: ${process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz"}/tours\n\n` +
      `To unsubscribe at any time, click here: ${process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz"}/unsubscribe?e=${Buffer.from(to).toString("base64")}\n\n` +
      `${site.name}\n${site.phone}`,
  });
}
