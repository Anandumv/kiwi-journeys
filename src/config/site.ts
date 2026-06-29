// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH FOR ALL BRAND STRINGS.
// To rebrand the whole site, edit the values here. Nothing else references the
// brand name/contact directly.  (Placeholder brand — swap before public launch.)
// ─────────────────────────────────────────────────────────────────────────────

export const site = {
  name: "Kiwi Globe Tours",
  shortName: "Kiwi Globe Tours",
  tagline: "New Zealand Adventure Tours & Packages",
  description:
    "Explore Aotearoa — relishing the wonders of New Zealand. Tailor-made coach, honeymoon, self-drive and South Island day tours.",
  phone: "+64 27 230 5342",
  phoneHref: "tel:+64272305342",
  email: "sales@kiwiglobetours.co.nz",
  address: "New Zealand",
  baseUrl: "http://localhost:3000",
  currency: "NZD",
  // Business operating timezone — all departures are scheduled in this zone.
  timezone: "Pacific/Auckland",
  social: {
    facebook: "https://www.facebook.com/share/193YYJk3ib/",
    instagram: "https://www.instagram.com/kiwiglobetours?igsh=MTc2Y29vZDBiYW03aw==",
    tripadvisor: "#",
  },
  // Fallback only — runtime stats come from the DB (SiteSetting). Kept honest.
  stats: [
    { value: "≤ 16", label: "Guests per departure" },
    { value: "5", label: "South Island regions" },
    { value: "100%", label: "Locally owned & run" },
    { value: "365", label: "Days a year we run" },
  ],
  nav: [
    { href: "/", label: "Home" },
    { href: "/tours", label: "Tours" },
    { href: "/destinations", label: "Destinations" },
    { href: "/sustainability", label: "Sustainability" },
    { href: "/about", label: "About" },
    { href: "/cruise-excursions", label: "Cruise Excursions" },
    { href: "/contact", label: "Contact" },
  ],
} as const;

export type Site = typeof site;
