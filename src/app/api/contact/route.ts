import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { getSiteSettings } from "@/lib/content";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().max(300).optional(),
  message: z.string().min(1).max(5000),
});

export async function POST(req: Request) {
  // 5 messages per IP per hour.
  const { allowed } = rateLimit(rateLimitKey(req, "contact"), { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { name, email, subject, message } = parsed.data;
  const site = await getSiteSettings();

  // Send via Resend if configured; otherwise log (dev fallback) so the form still works.
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const from = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
      await resend.emails.send({
        from,
        to: site.email,
        replyTo: email,
        subject: `[Contact] ${subject || "New enquiry"} — ${name}`,
        text: `From: ${name} <${email}>\n\n${message}`,
      });
      // Auto-responder so the sender knows their message arrived.
      await resend.emails.send({
        from,
        to: email,
        subject: `We received your message — ${site.name}`,
        text:
          `Hi ${name},\n\n` +
          `Thank you for getting in touch with ${site.name}. We've received your message ` +
          `and will get back to you within 1–2 business days.\n\n` +
          `--- Your message ---\n${message}\n---\n\n` +
          `If your enquiry is urgent, please call us at ${site.phone}.\n\n` +
          `${site.name}`,
      });
    } catch (e) {
      console.error("Contact email failed:", e);
      return NextResponse.json({ error: "Send failed" }, { status: 502 });
    }
  } else {
    console.log("[contact] (no RESEND_API_KEY) message received:", { name, email, subject });
  }

  return NextResponse.json({ ok: true });
}
