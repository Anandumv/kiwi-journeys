import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { allowed } = rateLimit(rateLimitKey(req, "newsletter"), { limit: 3, windowMs: 60 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: { email },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
