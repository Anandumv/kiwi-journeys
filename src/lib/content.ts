import { prisma } from "./db";
import type { Tour, PriceOption } from "@/data/tours";
import { tours as staticTours, destinations as staticDestinations } from "@/data/tours";
import { posts as staticPosts } from "@/data/blog";

// Content getters. They read from the database when available, and fall back to
// the bundled static content when there's no DB (e.g. the UI-only Vercel deploy).
// This keeps every public page rendering with no database connection required.

export type SiteSettings = {
  name: string;
  tagline: string;
  description: string;
  logoImage: string | null;
  phone: string;
  phoneHref: string;
  email: string;
  address: string;
  currency: string;
  heroImage: string;
  footerTagline: string;
  social: Record<string, string>;
  stats: { value: string; label: string }[];
  nav: { href: string; label: string }[];
  valueProps: { title: string; body: string }[];
  currencyRates: Record<string, number>;
};

export type DestinationItem = {
  slug: string; name: string; status: string; blurb: string; intro: string | null; heroImage: string | null;
};
export type BlogPostItem = {
  slug: string; title: string; date: string; excerpt: string; body: string[]; coverImage: string | null;
};
export type TestimonialItem = { name: string; country: string; text: string; rating: number };

// ── Static fallbacks ──────────────────────────────────────────────────────────
const STATIC_TESTIMONIALS: TestimonialItem[] = [
  { name: "Maddy R.", country: "Australia", text: "Felt less like a tour and more like a day out with a local mate. Relaxed pace, no rushing, brilliant.", rating: 5 },
  { name: "Devon & Ana", country: "Canada", text: "The Akaroa dolphin swim was the highlight of our whole trip. The crew were calm, kind and clearly cared.", rating: 5 },
  { name: "Hiroshi T.", country: "Japan", text: "Small group, comfortable van, and a guide who knew exactly where the best light and fewest crowds were.", rating: 5 },
];

const STATIC_VALUE_PROPS = [
  { title: "Small-group day trips", body: "Fully guided days out in a small group, led by someone who actually lives here and knows the back roads." },
  { title: "Multi-day journeys", body: "Set-route trips spread over a few days, with the driving, timing and bookings handled for you." },
  { title: "Cruise shore excursions", body: "Port-timed tours for cruise guests — ashore, out exploring, and back to the ship without the stress." },
  { title: "Private & bespoke", body: "Your own driver-guide and a day shaped entirely around what you'd most like to see." },
];

const DEFAULT_SETTINGS: SiteSettings = {
  name: "Kiwi Globe Tours",
  tagline: "New Zealand Adventure Tours & Packages",
  description: "Explore Aotearoa — relishing the wonders of New Zealand. Tailor-made coach, honeymoon, self-drive and South Island day tours.",
  logoImage: "/images/brand/Kiwi-Globe-Tours-NZ-resized.png",
  phone: "+64 27 230 5342",
  phoneHref: "tel:+64272305342",
  email: "sales@kiwiglobetours.co.nz",
  address: "New Zealand",
  currency: "NZD",
  heroImage: "/images/brand/Hero-Ocean-Alps.jpg",
  footerTagline: "New Zealand adventure tours and packages, crafted around how you want to travel.",
  social: {},
  stats: [],
  nav: [
    { href: "/", label: "Home" },
    { href: "/tours", label: "Tours" },
    { href: "/destinations", label: "Destinations" },
    { href: "/sustainability", label: "Sustainability" },
    { href: "/about", label: "About" },
    { href: "/cruise-excursions", label: "Cruise Excursions" },
    { href: "/contact", label: "Contact" },
  ],
  valueProps: STATIC_VALUE_PROPS,
  currencyRates: { NZD: 1, AUD: 0.92, USD: 0.6, GBP: 0.47, EUR: 0.56, INR: 51.5 },
};

const staticDestinationItems: DestinationItem[] = staticDestinations.map((d) => ({
  slug: d.slug, name: d.name, status: d.status, blurb: d.blurb, intro: null, heroImage: null,
}));
const staticPostItems: BlogPostItem[] = staticPosts.map((p) => ({
  slug: p.slug, title: p.title, date: new Date(p.date).toISOString(), excerpt: p.excerpt, body: p.body, coverImage: null,
}));

// ── Mapping ───────────────────────────────────────────────────────────────────
type DbTour = Awaited<ReturnType<typeof fetchToursRaw>>[number];
function toTour(t: DbTour): Tour {
  return {
    slug: t.slug, code: t.code, title: t.title, destination: t.destination,
    category: t.category as Tour["category"], durationLabel: t.durationLabel, durationMins: t.durationMins,
    ageRange: t.ageRange, startEnd: t.startEnd, pickup: t.pickup, summary: t.summary,
    priceFromCents: t.priceFromCents, heroImage: t.heroImage, gallery: t.gallery, highlights: t.highlights,
    itinerary: t.itinerary, included: t.included, optionalUpgrades: t.optionalUpgrades, importantInfo: t.importantInfo,
    featured: t.featured, closedMonths: t.closedMonths, departureTimes: t.departureTimes,
    departureWeekdays: t.departureWeekdays, capacityPerDeparture: t.capacityPerDeparture,
    priceOptions: t.priceOptions.map((p): PriceOption => ({ key: p.key, label: p.label, priceCents: p.priceCents, seatsPerUnit: p.seatsPerUnit })),
  };
}

function fetchToursRaw() {
  return prisma.tour.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { priceOptions: { orderBy: { sortOrder: "asc" } } },
  });
}

// ── Getters (DB with static fallback) ───────────────────────────────────────────
export async function getTours(): Promise<Tour[]> {
  try {
    const rows = await fetchToursRaw();
    return rows.length ? rows.map(toTour) : staticTours;
  } catch {
    return staticTours;
  }
}

export async function getTour(slug: string): Promise<Tour | null> {
  try {
    const t = await prisma.tour.findFirst({ where: { slug, isActive: true }, include: { priceOptions: { orderBy: { sortOrder: "asc" } } } });
    if (t) return toTour(t);
  } catch {
    /* fall through to static */
  }
  return staticTours.find((t) => t.slug === slug) ?? null;
}

export async function getDestinations(): Promise<DestinationItem[]> {
  try {
    const rows = await prisma.destination.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true, status: true, blurb: true, intro: true, heroImage: true },
    });
    return rows.length ? rows : staticDestinationItems;
  } catch {
    return staticDestinationItems;
  }
}

export async function getPosts(): Promise<BlogPostItem[]> {
  try {
    const rows = await prisma.blogPost.findMany({ where: { published: true }, orderBy: { date: "desc" } });
    if (rows.length) return rows.map((p) => ({ slug: p.slug, title: p.title, date: p.date.toISOString(), excerpt: p.excerpt, body: p.body, coverImage: p.coverImage }));
  } catch {
    /* fall through */
  }
  return staticPostItems;
}

export async function getPost(slug: string): Promise<BlogPostItem | null> {
  try {
    const p = await prisma.blogPost.findFirst({ where: { slug, published: true } });
    if (p) return { slug: p.slug, title: p.title, date: p.date.toISOString(), excerpt: p.excerpt, body: p.body, coverImage: p.coverImage };
  } catch {
    /* fall through */
  }
  return staticPostItems.find((p) => p.slug === slug) ?? null;
}

export async function getTestimonials(): Promise<TestimonialItem[]> {
  try {
    const rows = await prisma.testimonial.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" }, select: { name: true, country: true, text: true, rating: true } });
    return rows.length ? rows : STATIC_TESTIMONIALS;
  } catch {
    return STATIC_TESTIMONIALS;
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  let s;
  try {
    s = await prisma.siteSetting.findUnique({ where: { id: "singleton" } });
  } catch {
    return DEFAULT_SETTINGS;
  }
  if (!s) return DEFAULT_SETTINGS;
  return {
    name: s.name, tagline: s.tagline, description: s.description, logoImage: s.logoImage,
    phone: s.phone, phoneHref: s.phoneHref, email: s.email, address: s.address, currency: s.currency,
    heroImage: s.heroImage, footerTagline: s.footerTagline,
    social: s.social as Record<string, string>,
    stats: s.stats as { value: string; label: string }[],
    nav: s.nav as { href: string; label: string }[],
    valueProps: s.valueProps as { title: string; body: string }[],
    currencyRates: s.currencyRates as Record<string, number>,
  };
}
