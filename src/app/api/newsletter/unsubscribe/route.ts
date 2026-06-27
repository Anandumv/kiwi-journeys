import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const encoded = String(body.e ?? "");
  if (!encoded) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  let email: string;
  try {
    email = Buffer.from(encoded, "base64").toString("utf-8");
  } catch {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  await prisma.newsletterSubscriber.deleteMany({ where: { email } });
  return NextResponse.json({ ok: true });
}
