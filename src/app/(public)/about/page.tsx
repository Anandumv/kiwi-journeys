import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { getSiteSettings } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const description = `${s.name} is a Christchurch-based small-group day tour operator exploring the South Island. Locally owned, expert guides, year-round departures.`;
  return {
    title: "About Us",
    description,
    alternates: { canonical: `${SITE_URL}/about` },
    openGraph: {
      title: `About ${s.name} — Christchurch Day Tour Operator`,
      description,
      url: `${SITE_URL}/about`,
      images: [{ url: "/images/brand/Hero-Ocean-Alps.jpg", width: 1200, height: 630, alt: `About ${s.name}` }],
    },
    twitter: { card: "summary_large_image", title: `About ${s.name}`, description, images: ["/images/brand/Hero-Ocean-Alps.jpg"] },
  };
}

export default async function AboutPage() {
  const site = await getSiteSettings();
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE_URL}/about`,
    url: `${SITE_URL}/about`,
    name: `About ${site.name}`,
    description: `${site.name} is a Christchurch-based small-group day tour operator. Locally owned, expert guides, year-round South Island departures.`,
    mainEntity: { "@id": `${SITE_URL}/#organization` },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "About", item: `${SITE_URL}/about` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <PageHero eyebrow="Our Story" title="A small team, big country" subtitle="Small-group South Island day trips, run by people who actually live here." image="/images/general/view-over-Hanmer-from-Conical-Hill.jpg" />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="space-y-5 text-lg text-foreground/80 leading-relaxed">
          <h2 className="font-serif text-3xl font-semibold text-brand-900">Why we started Kiwi Journeys</h2>
          <p>
            Kiwi Journeys is a young, Christchurch-based outfit with a simple idea: that the best way
            to see the South Island is slowly, in a small group, with someone local doing the driving
            and the talking. No 50-seat coaches, no rushing between photo stops — just good days out.
          </p>
          <p>
            We keep groups small (sixteen at most), work with trusted local operators for the things
            they do best — the dolphin swims, the alpine train, the cellar doors — and build each day
            around giving you time to actually take it in.
          </p>
          <h2 className="font-serif text-3xl font-semibold text-brand-900 pt-4">How we travel</h2>
          <p>
            We try to travel lightly and leave places better than we found them, in the spirit of the
            Tiaki Promise — Aotearoa&apos;s shared commitment to care for the land, sea and people.
            Supporting the small communities and family operators we visit is part of that.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-6 rounded-2xl bg-brand-50 p-8 sm:grid-cols-4">
          {site.stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-serif text-3xl font-semibold text-brand-700">{s.value}</div>
              <div className="mt-1 text-xs text-foreground/60">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <h2 className="font-serif text-3xl font-semibold text-brand-900">What you can expect</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {["Small groups, never a big coach", "Local guides who know the area", "Days you can shape to suit you", "Clear, upfront pricing in NZD"].map((x) => (
              <li key={x} className="flex items-start gap-2 text-foreground/80">
                <span className="mt-1 text-brand-500">✓</span>{x}
              </li>
            ))}
          </ul>
        </div>
      </article>
    </>
  );
}
