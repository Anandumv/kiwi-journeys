"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

type NavItem = { href: string; label: string };

export function Header({
  name,
  logoImage,
  nav,
}: {
  name: string;
  logoImage?: string | null;
  nav: NavItem[];
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Transparent over the hero on the home page, solid once scrolled.
  const overHero = pathname === "/";
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = !overHero || scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid ? "border-b border-brand-100 bg-ivory/90 backdrop-blur-md" : "bg-gradient-to-b from-black/40 to-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Logo name={name} logoImage={logoImage} light={!solid} />
        <nav className="hidden items-center gap-7 lg:flex">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  solid ? (active ? "text-brand-700" : "text-foreground/70 hover:text-brand-600") : "text-white/90 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/tours"
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              solid ? "bg-brand-600 text-white hover:bg-brand-700" : "bg-white text-brand-800 hover:bg-white/90"
            }`}
          >
            Book a Tour
          </Link>
        </nav>
        <button
          className={`rounded-md p-2 lg:hidden ${solid ? "text-brand-800" : "text-white"}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav className="border-t border-brand-100 bg-ivory px-4 pb-4 pt-2 lg:hidden">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block rounded-md px-2 py-2.5 text-sm font-medium text-foreground/80 hover:bg-brand-50">
              {item.label}
            </Link>
          ))}
          <Link href="/tours" onClick={() => setOpen(false)} className="mt-2 block rounded-full bg-brand-600 px-5 py-2.5 text-center text-sm font-semibold text-white">
            Book a Tour
          </Link>
        </nav>
      )}
    </header>
  );
}
