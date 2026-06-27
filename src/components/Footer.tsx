import Link from "next/link";
import { Logo } from "./Logo";

export function Footer({
  name,
  logoImage,
  footerTagline,
  tagline,
  phone,
  phoneHref,
  email,
  address,
}: {
  name: string;
  logoImage?: string | null;
  footerTagline: string;
  tagline: string;
  phone: string;
  phoneHref: string;
  email: string;
  address: string;
}) {
  return (
    <footer className="mt-24 bg-brand-950 text-brand-100">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo name={name} logoImage={logoImage} light />
            <p className="mt-4 max-w-xs text-sm text-brand-200">{footerTagline}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Explore</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/tours" className="hover:text-white">Tours</Link></li>
              <li><Link href="/destinations" className="hover:text-white">Destinations</Link></li>
              <li><Link href="/cruise-excursions" className="hover:text-white">Cruise Excursions</Link></li>
              <li><Link href="/travel-insights" className="hover:text-white">Travel Insights</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Company</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/sustainability" className="hover:text-white">Sustainability</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms-of-use" className="hover:text-white">Terms of Use</Link></li>
              <li><Link href="/account/bookings" className="hover:text-white">My Bookings</Link></li>
              <li><Link href="/account/login" className="hover:text-white">Sign In</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Contact</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Phone: <a href={phoneHref} className="hover:text-white">{phone}</a></li>
              <li>Email: <a href={`mailto:${email}`} className="hover:text-white">{email}</a></li>
              <li>{address}</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-brand-800 pt-6 text-xs text-brand-300 sm:flex-row">
          <p>© {new Date().getFullYear()} {name}. All rights reserved.</p>
          <p>{tagline}</p>
        </div>
      </div>
    </footer>
  );
}
