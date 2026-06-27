"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/promo-codes", label: "Promo Codes" },
  { href: "/admin/gift-vouchers", label: "Gift Vouchers" },
  { href: "/admin/waitlist", label: "Waitlist" },
  { href: "/admin/tours", label: "Tours" },
  { href: "/admin/destinations", label: "Destinations" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/settings", label: "Site Settings" },
  { href: "/admin/users", label: "Admin Users" },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const navLinks = (
    <nav className="flex-1 space-y-0.5 p-3">
      {links.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-brand-600 text-white" : "text-foreground/70 hover:bg-brand-50"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  const accountFooter = (
    <div className="border-t border-ivory-200 p-3">
      <p className="px-2 text-xs text-foreground/50">{email}</p>
      <form action="/api/admin/logout" method="post">
        <button className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">Sign out</button>
      </form>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-ivory-200 bg-white p-4 lg:hidden">
        <Link href="/" className="font-serif text-lg font-semibold text-brand-800">Kiwi Journeys</Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          aria-expanded={open}
          className="rounded-md p-2 text-brand-800"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer + backdrop */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-64 max-w-[80vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-ivory-200 p-5">
              <div>
                <Link href="/" className="font-serif text-lg font-semibold text-brand-800">Kiwi Journeys</Link>
                <p className="mt-0.5 text-xs text-foreground/50">Admin</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close admin menu" className="rounded-md p-1 text-foreground/50">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>
            {navLinks}
            {accountFooter}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-ivory-200 bg-white lg:flex">
        <div className="border-b border-ivory-200 p-5">
          <Link href="/" className="font-serif text-lg font-semibold text-brand-800">Kiwi Journeys</Link>
          <p className="mt-0.5 text-xs text-foreground/50">Admin</p>
        </div>
        {navLinks}
        {accountFooter}
      </aside>
    </>
  );
}
