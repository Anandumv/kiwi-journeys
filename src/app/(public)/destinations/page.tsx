import { serializeJsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import { getDestinations, getTours } from "@/lib/content";

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
  const [destinations, tours] = await Promise.all([getDestinations(), getTours()]);
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(collectionLd) }} />
      <PageHero eyebrow="Places to go" title="Destinations" subtitle="Find a day trip by the place you want to see." image="/images/general/arthurs-pass-landscape.jpg"
        caption="Arthur's Pass National Park"
      />
      <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5 border-b border-[#202b2626] pb-6">
          <p className="eyebrow text-foreground">Day trips / South Island</p>
          <p className="max-w-md text-sm leading-relaxed text-foreground/75">Choose a place first. Each route returns the same day.</p>
        </div>
        <div className="grid gap-x-8 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
          {destinations.filter(d => d.status === "active").map((d, index) => {
            const key = d.slug === "kaikoura" ? "Kaik" : d.slug === "hanmer-springs" ? "Hanmer" : d.slug === "tekapo" ? "Tekapo" : d.slug === "akaroa" ? "Akaroa" : d.slug === "waipara" ? "Waipara" : "Christchurch";
            const photo = d.heroImage || tours.find(t => t.destination.includes(key))?.heroImage;
            return <Link key={d.slug} href={`/destinations/${d.slug}`} className="group block border-b border-[#202b2626] pb-5">
              <div className="relative aspect-[3/2] overflow-hidden bg-brand-100">
                {photo && <Image src={photo} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.025]" />}
              </div>
              <div className="mt-5 flex items-start gap-5">
                <span className="pt-1 text-xs text-foreground/75">{String(index+1).padStart(2,"0")}</span>
                <div className="flex-1"><h2 className="text-2xl font-medium tracking-tight text-foreground">{d.name}</h2><p className="mt-2 text-sm leading-relaxed text-foreground/75">{d.blurb}</p></div>
                <span aria-hidden="true" className="text-lg text-foreground">↗</span>
              </div>
            </Link>;
          })}
        </div>
      </section>
    </>
  );
}
