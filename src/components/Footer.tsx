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
  social = {},
}: {
  name: string;
  logoImage?: string | null;
  footerTagline: string;
  tagline: string;
  phone: string;
  phoneHref: string;
  email: string;
  address: string;
  social?: Record<string, string>;
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
              <li><Link href="/private-tours" className="hover:text-white">Private Tours</Link></li>
              <li><Link href="/gift-vouchers" className="hover:text-white">Gift Vouchers</Link></li>
              <li><Link href="/travel-insights" className="hover:text-white">Travel Insights</Link></li>
              <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
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
        {Object.keys(social).length > 0 && (
          <div className="mt-10 flex items-center gap-4 border-t border-brand-800 pt-8">
            {social.facebook && social.facebook !== "#" && (
              <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="text-brand-300 hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
            )}
            {social.instagram && social.instagram !== "#" && (
              <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="text-brand-300 hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            )}
            {social.tripadvisor && social.tripadvisor !== "#" && (
              <a href={social.tripadvisor} target="_blank" rel="noopener noreferrer" aria-label="TripAdvisor"
                className="text-brand-300 hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 8.5h-1.26A5.49 5.49 0 0112 7a5.49 5.49 0 00-4.24 1.5H6.5l-1.5 1.5h2.1A5.5 5.5 0 006.5 12a5.5 5.5 0 005.5 5.5 5.5 5.5 0 005.5-5.5 5.5 5.5 0 00-1.6-3l2.1-.001L17.5 8.5zm-5.5 8a3.5 3.5 0 110-7 3.5 3.5 0 010 7zm0-5.5a2 2 0 100 4 2 2 0 000-4z"/>
                </svg>
              </a>
            )}
          </div>
        )}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-brand-800 pt-6 text-xs text-brand-300 sm:flex-row">
          <p>© {new Date().getFullYear()} {name}. All rights reserved.</p>
          <p>{tagline}</p>
        </div>
      </div>
    </footer>
  );
}
