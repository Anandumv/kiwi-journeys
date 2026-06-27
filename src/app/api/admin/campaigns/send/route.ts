import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/content";

export const dynamic = "force-dynamic";
// Route is protected by proxy.ts admin middleware — no extra session check needed.

const schema = z.object({
  subject: z.string().min(3).max(200),
  body: z.string().min(10).max(10000),
  filters: z.object({
    q: z.string().optional(),
    consent: z.string().optional(),
  }).optional(),
});

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const { subject, body, filters } = parsed.data;

  const customers = await prisma.customer.findMany({
    where: {
      marketingConsent: true,
      ...(filters?.q && {
        OR: [
          { fullName: { contains: filters.q, mode: "insensitive" } },
          { email: { contains: filters.q, mode: "insensitive" } },
        ],
      }),
    },
    select: { email: true, fullName: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Deduplicate by email (Customer table has one row per booking).
  const seen = new Set<string>();
  const unique = customers.filter((c) => {
    if (seen.has(c.email)) return false;
    seen.add(c.email);
    return true;
  }).slice(0, 100);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Email not configured." }, { status: 500 });

  const resend = new Resend(apiKey);
  const site = await getSiteSettings();
  const from = process.env.BOOKINGS_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;

  let sent = 0;
  let skipped = 0;

  for (const customer of unique) {
    const firstName = customer.fullName.split(" ")[0];
    const personalised = body
      .replace(/\{name\}/g, firstName)
      .replace(/\{fullName\}/g, customer.fullName);

    const ok = await resend.emails
      .send({ from, to: customer.email, subject, text: personalised })
      .then(() => true)
      .catch((e) => { console.error(`Campaign send failed ${customer.email}:`, e); return false; });

    if (ok) sent++;
    else skipped++;

    await sleep(50);
  }

  return NextResponse.json({ sent, skipped, total: unique.length });
}
