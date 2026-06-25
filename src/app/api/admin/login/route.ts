import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signSession, SESSION_COOKIE } from "@/lib/auth";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  // 10 attempts per IP per 15 minutes.
  const { allowed } = rateLimit(rateLimitKey(req, "login"), { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const { email, password } = await req.json().catch(() => ({ email: "", password: "" }));
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  const user = await prisma.adminUser.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const token = await signSession({ sub: user.id, email: user.email, name: user.name, role: user.role });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
