import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { TourCard } from "@/components/TourCard";
import { getDestinations, getTours } from "@/lib/content";

// Map a destination slug to the tours that visit it (loose match on destination text).
const regionMatch: Record<string, (dest: string) => boolean> = {
  christchurch: (d) => d.includes("Christchurch") || d === "Waimakariri",
  akaroa: (d) => d.includes("Akaroa"),
  kaikoura: (d) => d.includes("Kaik"),
  waipara: (d) => d.includes("Waipara"),
  "hanmer-springs": (d) => d.includes("Hanmer"),
};

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const { region } = await params;
  const destinations = await getDestinations();
  const dest = destinations.find((d) => d.slug === region);
  if (!dest) return { title: "Destination" };
  const url = `${SITE_URL}/destinations/${dest.slug}`;
  const description = dest.intro || dest.blurb || `Explore day tours in ${dest.name}, New Zealand.`;
  return {
    title: `${dest.name} Day Tours`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${dest.name} Day Tours | New Zealand`,
      description,
      url,
      images: dest.heroImage ? [{ url: dest.heroImage, width: 1200, height: 630, alt: dest.name }] : undefined,
    },
    twitter: { card: "summary_large_image", title: `${dest.name} Day Tours`, description },
  };
}

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  const [destinations, tours] = await Promise.all([getDestinations(), getTours()]);
  const dest = destinations.find((d) => d.slug === region && d.status === "active");
  if (!dest) notFound();

  const match = regionMatch[region] ?? (() => false);
  const regionTours = tours.filter((t) => match(t.destination));
  const pageUrl = `${SITE_URL}/destinations/${region}`;

  const destinationLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "@id": pageUrl,
    name: dest.name,
    description: dest.intro || dest.blurb,
    url: pageUrl,
    image: dest.heroImage ?? undefined,
    touristType: { "@type": "Audience", audienceType: "Tourists" },
    includesAttraction: regionTours.map((t) => ({
      "@type": "TouristAttraction",
      name: t.title,
      url: `${SITE_URL}/tours/${t.slug}`,
    })),
    containedInPlace: { "@type": "Country", name: "New Zealand" },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Destinations", item: `${SITE_URL}/destinations` },
      { "@type": "ListItem", position: 3, name: dest.name, item: pageUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(destinationLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <PageHero eyebrow="Destination" title={dest.name} subtitle={dest.intro ?? dest.blurb} image={dest.heroImage ?? undefined} />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="font-serif text-3xl font-semibold text-brand-900">Tours in {dest.name}</h2>
        {regionTours.length === 0 ? (
          <p className="mt-4 text-foreground/60">New tours for this destination are coming soon.</p>
        ) : (
          <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {regionTours.map((t) => <TourCard key={t.slug} tour={t} />)}
          </div>
        )}
      </section>
    </>
  );
}
