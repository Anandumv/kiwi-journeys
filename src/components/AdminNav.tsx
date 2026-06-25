"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/tours", label: "Tours" },
  { href: "/admin/destinations", label: "Destinations" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/settings", label: "Site Settings" },
  { href: "/admin/users", label: "Admin Users" },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-ivory-200 bg-white">
      <div className="border-b border-ivory-200 p-5">
        <Link href="/" className="font-serif text-lg font-semibold text-brand-800">Kiwi Journeys</Link>
        <p className="mt-0.5 text-xs text-foreground/50">Admin</p>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {links.map((l) => {
          const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-brand-600 text-white" : "text-foreground/70 hover:bg-brand-50"}`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-ivory-200 p-3">
        <p className="px-2 text-xs text-foreground/50">{email}</p>
        <form action="/api/admin/logout" method="post">
          <button className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">Sign out</button>
        </form>
      </div>
    </aside>
  );
}
