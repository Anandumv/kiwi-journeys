import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signCustomerSession, CUSTOMER_SESSION_COOKIE } from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const next = searchParams.get("next") || "/account/bookings";

  if (!token || !email) {
    return new Response("Invalid link.", { status: 400 });
  }

  const magic = await prisma.magicToken.findUnique({ where: { token } });

  if (!magic || magic.email !== email.toLowerCase()) {
    return new Response("Invalid or expired link.", { status: 400 });
  }
  if (magic.usedAt || magic.expiresAt < new Date()) {
    return new Response("This link has expired or already been used. Please request a new one.", { status: 400 });
  }

  await prisma.magicToken.update({ where: { id: magic.id }, data: { usedAt: new Date() } });

  // Get the customer's name from their most recent booking.
  const customer = await prisma.customer.findFirst({
    where: { email: email.toLowerCase() },
    orderBy: { createdAt: "desc" },
    select: { fullName: true },
  });

  const jwt = await signCustomerSession({
    sub: email.toLowerCase(),
    email: email.toLowerCase(),
    name: customer?.fullName ?? "",
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";
  const redirectUrl = next.startsWith("/") ? `${baseUrl}${next}` : `${baseUrl}/account/bookings`;

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(CUSTOMER_SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
