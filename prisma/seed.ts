import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { tours, destinations } from "../src/data/tours";
import { posts } from "../src/data/blog";
import { site } from "../src/config/site";
import { generateSessions } from "../src/lib/availability";

const prisma = new PrismaClient();

const valueProps = [
  { title: "Small-group day trips", body: "Fully guided days out in a small group, led by someone who actually lives here and knows the back roads." },
  { title: "Multi-day journeys", body: "Set-route trips spread over a few days, with the driving, timing and bookings handled for you. (Coming soon.)" },
  { title: "Cruise shore excursions", body: "Port-timed tours for cruise guests — ashore, out exploring, and back to the ship without the stress." },
  { title: "Private & bespoke", body: "Your own driver-guide and a day shaped entirely around what you'd most like to see." },
];

// Fresh, clearly-original sample testimonials (replace with real reviews later).
const testimonials = [
  { name: "Maddy R.", country: "Australia", text: "Felt less like a tour and more like a day out with a local mate. Relaxed pace, no rushing, brilliant.", rating: 5, sortOrder: 0 },
  { name: "Devon & Ana", country: "Canada", text: "The Akaroa dolphin swim was the highlight of our whole trip. The crew were calm, kind and clearly cared.", rating: 5, sortOrder: 1 },
  { name: "Hiroshi T.", country: "Japan", text: "Small group, comfortable van, and a guide who knew exactly where the best light and fewest crowds were.", rating: 5, sortOrder: 2 },
];

async function main() {
  console.log("Seeding tours…");
  for (const [i, t] of tours.entries()) {
    const data = {
      code: t.code,
      title: t.title,
      summary: t.summary,
      destination: t.destination,
      destinationSlug: deriveDestinationSlug(t.destination),
      category: t.category,
      durationLabel: t.durationLabel,
      durationMins: t.durationMins,
      ageRange: t.ageRange,
      startEnd: t.startEnd,
      pickup: t.pickup,
      priceFromCents: t.priceFromCents,
      heroImage: t.heroImage,
      gallery: t.gallery,
      highlights: t.highlights,
      itinerary: t.itinerary,
      included: t.included,
      optionalUpgrades: t.optionalUpgrades ?? [],
      importantInfo: t.importantInfo ?? [],
      featured: t.featured ?? false,
      closedMonths: t.closedMonths ?? [],
      departureTimes: t.departureTimes,
      departureWeekdays: t.departureWeekdays,
      capacityPerDeparture: t.capacityPerDeparture,
      sortOrder: i,
    };
    const tour = await prisma.tour.upsert({
      where: { slug: t.slug },
      create: { slug: t.slug, ...data },
      update: data,
    });

    for (const [j, po] of t.priceOptions.entries()) {
      await prisma.priceOption.upsert({
        where: { tourId_key: { tourId: tour.id, key: po.key } },
        create: { tourId: tour.id, key: po.key, label: po.label, priceCents: po.priceCents, seatsPerUnit: po.seatsPerUnit, sortOrder: j },
        update: { label: po.label, priceCents: po.priceCents, seatsPerUnit: po.seatsPerUnit, sortOrder: j },
      });
    }

    const created = await generateSessions({
      tourId: tour.id,
      times: t.departureTimes,
      weekdays: t.departureWeekdays,
      capacity: t.capacityPerDeparture,
      horizonDays: 90,
      closedMonths: t.closedMonths,
    });
    console.log(`  ${t.title}: ${t.priceOptions.length} options, ${created} new departures`);
  }

  console.log("Seeding destinations…");
  for (const [i, d] of destinations.entries()) {
    await prisma.destination.upsert({
      where: { slug: d.slug },
      create: { slug: d.slug, name: d.name, status: d.status, blurb: d.blurb, sortOrder: i },
      update: { name: d.name, status: d.status, blurb: d.blurb, sortOrder: i },
    });
  }

  console.log("Seeding blog posts…");
  for (const p of posts) {
    await prisma.blogPost.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, title: p.title, date: new Date(p.date), excerpt: p.excerpt, body: p.body, published: true },
      update: { title: p.title, date: new Date(p.date), excerpt: p.excerpt, body: p.body },
    });
  }

  console.log("Seeding testimonials…");
  // Refresh testimonials so the rebrand copy applies on reseed.
  await prisma.testimonial.deleteMany({});
  for (const t of testimonials) await prisma.testimonial.create({ data: t });

  console.log("Seeding site settings…");
  // Kiwi Globe Tours brand. Prices charged in NZD; INR shown via the currency switcher.
  const brand = {
    name: site.name, // Kiwi Globe Tours
    tagline: "New Zealand Adventure Tours & Packages",
    description:
      "Explore Aotearoa — relishing the wonders of New Zealand. Tailor-made coach, honeymoon, self-drive and South Island day tours, planned by people who know the country.",
    phone: site.phone,
    phoneHref: site.phoneHref,
    email: site.email,
    address: site.address,
    currency: site.currency,
    logoImage: "/images/brand/Kiwi-Globe-Tours-NZ-resized.png",
    heroImage: "/images/brand/Hero-Ocean-Alps.jpg",
    footerTagline: "New Zealand adventure tours and packages, crafted around how you want to travel.",
    social: site.social,
    nav: site.nav,
    valueProps,
    stats: [
      { value: "≤ 16", label: "Guests per departure" },
      { value: "5", label: "South Island regions" },
      { value: "100%", label: "Locally owned & run" },
      { value: "365", label: "Days a year we run" },
    ],
    currencyRates: { NZD: 1, AUD: 0.92, USD: 0.6, GBP: 0.47, EUR: 0.56, INR: 51.5 },
  };
  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...brand },
    update: brand,
  });

  console.log("Seeding admin user…");
  const email = process.env.ADMIN_EMAIL || "admin@kiwijourneys.example";
  const password = process.env.ADMIN_PASSWORD || "changeme123";
  console.log(`  using email: ${email}`);
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.adminUser.upsert({
    where: { email },
    create: { email, passwordHash, name: "Administrator", role: "owner" },
    update: { passwordHash },
  });
  console.log(`  admin upserted: ${email}`);

  console.log("Done.");
}

function deriveDestinationSlug(dest: string): string {
  const d = dest.toLowerCase();
  if (d.includes("akaroa")) return "akaroa";
  if (d.includes("kaik")) return "kaikoura";
  if (d.includes("waipara")) return "waipara";
  if (d.includes("hanmer")) return "hanmer-springs";
  return "christchurch";
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
