import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import { sendEmail } from "@/lib/email";
import { getSiteSettings } from "@/lib/content";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "Email is temporarily unavailable. Please contact us directly." }, { status: 503 });
  const { allowed } = rateLimit(rateLimitKey(req, "magic-link"), { limit: 3, windowMs: 60 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid email." }, { status: 400 });

  const email = parsed.data.email.toLowerCase().trim();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.magicToken.create({ data: { email, token, expiresAt } });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";
  const link = `${baseUrl}/api/account/verify?token=${token}&email=${encodeURIComponent(email)}`;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const site = await getSiteSettings();
    const resend = new Resend(apiKey);
    try {
    await sendEmail(resend, {
      from: process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`,
      to: email,
      subject: `Sign in to ${site.name}`,
      text:
        `Hi there,\n\n` +
        `Click the link below to sign in to your ${site.name} account.\n` +
        `This link expires in 15 minutes and can only be used once.\n\n` +
        `${link}\n\n` +
        `If you did not request this, you can safely ignore this email.\n\n` +
        `${site.name}`,
    });
    } catch {
      await prisma.magicToken.deleteMany({ where: { token } });
      return NextResponse.json({ error: "Could not send sign-in email. Please try again." }, { status: 502 });
    }
  } else {
    console.log("[magic-link] (no RESEND_API_KEY) link:", link);
  }

  return NextResponse.json({ ok: true });
}
