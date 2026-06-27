import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getTours } from "@/lib/content";
import { TourCard } from "@/components/TourCard";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export const metadata: Metadata = {
  title: "Cruise Shore Excursions — Lyttelton & Akaroa",
  description: "Shore excursions timed around your ship's schedule. Guaranteed return to port. Small groups, expert guides, Lyttelton and Akaroa, New Zealand.",
  alternates: { canonical: `${SITE_URL}/cruise-excursions` },
  openGraph: {
    title: "Cruise Shore Excursions — Lyttelton & Akaroa | Kiwi Globe Tours",
    description: "Shore excursions timed around your ship's schedule. Guaranteed return to port.",
    url: `${SITE_URL}/cruise-excursions`,
    images: [{ url: "/images/general/kaikoura-whale-watch.jpg", width: 1200, height: 630, alt: "Cruise Shore Excursions New Zealand" }],
  },
  twitter: { card: "summary_large_image", title: "Cruise Shore Excursions | Kiwi Globe Tours", description: "Shore excursions timed around your ship's schedule. Guaranteed return to port." },
};

export default async function CruisePage() {
  const tours = await getTours();
  const cruiseSlugs = ["akaroa-day-tour", "christchurch-antarctic-centre", "christchurch-city-sightseeing", "akaroa-swim-with-dolphins"];
  const picks = tours.filter((t) => cruiseSlugs.includes(t.slug));
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${SITE_URL}/cruise-excursions#service`,
    name: "Cruise Shore Excursions — Lyttelton & Akaroa",
    description: "Shore excursions designed for cruise passengers calling at Lyttelton and Akaroa, New Zealand. Port-timed tours with guaranteed return to the ship.",
    url: `${SITE_URL}/cruise-excursions`,
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: [
      { "@type": "Place", name: "Lyttelton, New Zealand" },
      { "@type": "Place", name: "Akaroa, New Zealand" },
    ],
    serviceType: "Shore Excursion",
    audience: { "@type": "Audience", audienceType: "Cruise Passengers" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Cruise Shore Excursions",
      itemListElement: picks.map((t) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "TouristTrip",
          name: t.title,
          url: `${SITE_URL}/tours/${t.slug}`,
        },
      })),
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Cruise Excursions", item: `${SITE_URL}/cruise-excursions` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <PageHero title="Cruise Shore Excursions" subtitle="On a cruise? Exclusive tours designed just for cruise passengers — back to the ship, every time." image="/images/general/kaikoura-whale-watch.jpg" />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 text-foreground/80 leading-relaxed">
        <p>
          Calling at Lyttelton or Akaroa? Our shore excursions are timed around your ship&apos;s
          schedule, with priority pickup and guaranteed return to the port. Explore Christchurch, swim
          with rare Hector&apos;s dolphins, or take in the alpine scenery — all in a day.
        </p>
        <p className="mt-3 text-sm text-foreground/60">
          Travelling as a group from a cruise line? <Link href="/contact" className="font-semibold text-brand-600 hover:underline">Contact us</Link> for tailored group rates.
        </p>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <h2 className="font-serif text-3xl font-semibold text-brand-900">Popular with cruise guests</h2>
        <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {picks.map((t) => <TourCard key={t.slug} tour={t} />)}
        </div>
      </section>
    </>
  );
}
