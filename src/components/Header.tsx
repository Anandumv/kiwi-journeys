"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

type NavItem = { href: string; label: string };

export function Header({
  name,
  logoImage,
  nav,
  phone,
  phoneHref,
}: {
  name: string;
  logoImage?: string | null;
  nav: NavItem[];
  phone?: string | null;
  phoneHref?: string | null;
}) {
  const [open, setOpen] = useState(false);

  const pathname = usePathname();
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); menuButton.current?.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // A solid navigation bar stays legible over the carriage interior and scenery.
  const solid = true;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid ? "border-b border-[#202b2620] bg-[#f8f8f3]/92 backdrop-blur-md" : "bg-gradient-to-b from-black/40 to-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Logo name={name} logoImage={logoImage} light={!solid} />
        <nav aria-label="Main navigation" className="hidden items-center gap-6 xl:flex">
          {nav.filter((item) => item.href !== "/").map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`text-sm font-medium transition-colors ${
                  solid ? (active ? "text-foreground underline decoration-1 underline-offset-[6px]" : "text-foreground/70 hover:text-foreground") : "text-white/90 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {phone && phoneHref && (
            <a
              href={phoneHref}
              className={`border-l border-[#202b2626] pl-6 text-sm font-medium tabular-nums transition-colors ${solid ? "text-foreground/70 hover:text-foreground" : "text-white/90 hover:text-white"}`}
            >
              {phone}
            </a>
          )}
          <Link
            href="/tours"
            className={`px-5 py-2.5 text-sm font-semibold transition ${
              solid ? "bg-[#203c33] text-white hover:bg-[#315445]" : "bg-white text-brand-800 hover:bg-white/90"
            }`}
          >
            Book a Tour
          </Link>
        </nav>
        <button
          ref={menuButton}
          className={`rounded-md p-3 xl:hidden ${solid ? "text-brand-800" : "text-white"}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="h-[calc(100dvh-4.25rem)] overflow-y-auto border-t border-[#202b2620] bg-[#f8f8f3] px-5 pb-8 pt-4 xl:hidden">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`)) ? "page" : undefined} onClick={() => setOpen(false)} className="block border-b border-[#202b2620] py-3 font-[family-name:var(--font-display)] text-[40px] font-medium leading-none tracking-[-.02em] text-foreground aria-[current=page]:text-brand-700">
              {item.label}
            </Link>
          ))}
          <Link href="/tours" onClick={() => setOpen(false)} className="mt-6 flex min-h-12 items-center justify-between bg-[#203c33] px-5 text-sm font-semibold text-white">
            Book a Tour <span aria-hidden="true">↗</span>
          </Link>
          {phone && phoneHref && <a href={phoneHref} className="mt-4 block py-2 text-sm font-medium text-foreground/75">Call {phone}</a>}
        </nav>
      )}
    </header>
  );
}
