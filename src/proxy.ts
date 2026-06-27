import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { verifyCustomerSession, CUSTOMER_SESSION_COOKIE } from "@/lib/customerAuth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Admin routes ---
  if (pathname === "/admin/login" || pathname === "/api/admin/login") return NextResponse.next();
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifySession(token) : null;
    if (!session) {
      if (pathname.startsWith("/api/admin")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // --- Customer account routes ---
  // Public paths that don't require a session.
  const customerPublic = ["/account/login", "/api/account/login", "/api/account/verify", "/api/account/logout"];
  if (customerPublic.includes(pathname)) return NextResponse.next();

  if (pathname.startsWith("/account") || pathname.startsWith("/api/account")) {
    const token = req.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
    const session = token ? await verifyCustomerSession(token) : null;
    if (!session) {
      if (pathname.startsWith("/api/account")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const url = req.nextUrl.clone();
      url.pathname = "/account/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/account/:path*", "/api/account/:path*"],
};
