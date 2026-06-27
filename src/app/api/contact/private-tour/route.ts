import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { getSiteSettings } from "@/lib/content";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(50).optional().or(z.literal("")),
  tours: z.array(z.string()).min(1),
  preferredDates: z.string().max(200).optional().or(z.literal("")),
  groupSize: z.number().int().min(1).max(500),
  message: z.string().max(3000).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const { allowed } = rateLimit(rateLimitKey(req, "private-tour"), {
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const d = parsed.data;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[private-tour] enquiry from", d.email, "(no RESEND_API_KEY)");
    return NextResponse.json({ ok: true });
  }

  const site = await getSiteSettings();
  const resend = new Resend(apiKey);
  const from = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
  const adminEmail =
    site.email || process.env.ADMIN_EMAIL || "admin@kiwiglobetours.co.nz";

  await Promise.all([
    resend.emails.send({
      from,
      to: adminEmail,
      replyTo: d.email,
      subject: `Private tour enquiry — ${d.fullName} (group of ${d.groupSize})`,
      text:
        `New private tour enquiry from ${site.name} website.\n\n` +
        `Name: ${d.fullName}\n` +
        `Email: ${d.email}\n` +
        `Phone: ${d.phone || "not provided"}\n` +
        `Group size: ${d.groupSize}\n` +
        `Tours of interest: ${d.tours.join(", ")}\n` +
        `Preferred dates: ${d.preferredDates || "flexible"}\n` +
        `\nMessage:\n${d.message || "(none)"}\n\n` +
        `Reply directly to this email to respond to the customer.`,
    }),
    resend.emails.send({
      from,
      to: d.email,
      subject: `We've received your private tour enquiry — ${site.name}`,
      text:
        `Hi ${d.fullName},\n\n` +
        `Thank you for your interest in a private tour with ${site.name}!\n\n` +
        `We've received your enquiry for a group of ${d.groupSize} and will be in touch within one business day to discuss dates, itinerary, and pricing.\n\n` +
        `Your enquiry details:\n` +
        `Tours of interest: ${d.tours.join(", ")}\n` +
        `Preferred dates: ${d.preferredDates || "flexible"}\n\n` +
        `In the meantime, feel free to call us at ${site.phone} if you have any urgent questions.\n\n` +
        `We look forward to crafting your perfect New Zealand adventure!\n${site.name}`,
    }),
  ]).catch((e) => console.error("Private tour email failed:", e));

  return NextResponse.json({ ok: true });
}
