import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getDestinations } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export const metadata: Metadata = {
  title: "South Island Destinations",
  description: "Explore New Zealand South Island destinations — Christchurch, Akaroa, Kaikōura, Waipara Valley and more. Day tours departing daily.",
  alternates: { canonical: `${SITE_URL}/destinations` },
  openGraph: {
    title: "South Island Destinations | Kiwi Globe Tours",
    description: "Explore New Zealand South Island destinations. Day tours departing daily.",
    url: `${SITE_URL}/destinations`,
    images: [{ url: "/images/brand/Hero-Ocean-Alps.jpg", width: 1200, height: 630, alt: "South Island New Zealand Destinations" }],
  },
  twitter: { card: "summary_large_image", title: "South Island Destinations | Kiwi Globe Tours", description: "Explore New Zealand South Island destinations. Day tours departing daily." },
};

export default async function DestinationsPage() {
  const destinations = await getDestinations();
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/destinations`,
    url: `${SITE_URL}/destinations`,
    name: "South Island New Zealand Destinations",
    description: "Explore New Zealand South Island destinations — Christchurch, Akaroa, Kaikōura, Waipara Valley and more.",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Destinations", item: `${SITE_URL}/destinations` },
      ],
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <PageHero eyebrow="Travel New Zealand Your Way" title="Destinations" subtitle="New Zealand, a captivating land of breathtaking natural beauty and warm, friendly locals." />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <div
              key={d.slug}
              className={`rounded-2xl border p-6 ${d.status === "active" ? "border-brand-200 bg-white" : "border-dashed border-brand-100 bg-brand-50/50"}`}
            >
              <h2 className="font-serif text-xl font-semibold text-brand-900">{d.name}</h2>
              <p className="mt-2 text-sm text-foreground/70">{d.status === "active" ? d.blurb : "Coming Soon"}</p>
              {d.status === "active" && (
                <Link href={`/destinations/${d.slug}`} className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline">
                  Explore tours →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
