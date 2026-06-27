import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ToursExplorer } from "@/components/ToursExplorer";
import { getTours } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export const metadata: Metadata = {
  title: "New Zealand Day Tours",
  description: "Browse small-group South Island day tours from Christchurch — Akaroa, Kaikōura, Hanmer Springs, Waipara Valley and more. Book online, free cancellation.",
  alternates: { canonical: `${SITE_URL}/tours` },
  openGraph: {
    title: "New Zealand Day Tours | Kiwi Globe Tours",
    description: "Small-group South Island day tours. Book online, instant confirmation.",
    url: `${SITE_URL}/tours`,
    images: [{ url: "/images/brand/Hero-Ocean-Alps.jpg", width: 1200, height: 630, alt: "South Island Day Tours from Christchurch" }],
  },
  twitter: { card: "summary_large_image", title: "New Zealand Day Tours | Kiwi Globe Tours", description: "Small-group South Island day tours. Book online, instant confirmation.", images: ["/images/brand/Hero-Ocean-Alps.jpg"] },
};

export default async function ToursPage() {
  const tours = await getTours();

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "South Island Day Tours",
    url: `${SITE_URL}/tours`,
    numberOfItems: tours.length,
    itemListElement: tours.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "TouristTrip",
        "@id": `${SITE_URL}/tours/${t.slug}`,
        url: `${SITE_URL}/tours/${t.slug}`,
        name: t.title,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <PageHero
        eyebrow="Exciting Experiences"
        title="Our Tours"
        subtitle="Small-group days out across the South Island — pick a date and book online in minutes."
        image="/images/brand/Hero-Ocean-Alps.jpg"
      />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Suspense fallback={<p className="text-foreground/60">Loading tours…</p>}>
          <ToursExplorer tours={tours} />
        </Suspense>
      </div>
    </>
  );
}
