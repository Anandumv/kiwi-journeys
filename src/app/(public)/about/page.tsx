import { serializeJsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { EditorialSection, editorial } from "@/components/EditorialSection";
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(orgLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />
      <PageHero eyebrow="Our Story" title="Good days, locally led" subtitle="Small-group South Island day trips, run by people who actually live here." image="/images/tours/christchurch-city-sightseeing/7395a4_d7783ce525344652952b15791d55ce9f-mv2_1.jpg"
        caption="Avon River, Christchurch"
      />
      <div className={editorial.wrap}>
        <EditorialSection number={1} label="Who we are" title="A closer look at the South Island" id="who">
          <div className={editorial.prose}>
            <p>
              Kiwi Journeys is a young, Christchurch-based outfit with a simple idea: that the best way
              to see the South Island is slowly, in a small group, with someone local doing the driving
              and the talking. No 50-seat coaches, no rushing between photo stops — just good days out.
            </p>
            <p>
              We keep groups small, work with trusted local operators for the things
              they do best — the dolphin swims, the alpine train, the cellar doors — and build each day
              around giving you time to actually take it in.
            </p>
          </div>
          {site.stats.length > 0 && (
            <dl className={editorial.figures}>
              {site.stats.map((s) => (
                <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>
              ))}
            </dl>
          )}
        </EditorialSection>
        <EditorialSection number={2} label="How we travel" title="Leave places better than we found them" id="how">
          <div className={editorial.prose}>
            <p>
              We try to travel lightly and leave places better than we found them, in the spirit of the
              Tiaki Promise — Aotearoa&apos;s shared commitment to care for the land, sea and people.
              Supporting the small communities and family operators we visit is part of that.
            </p>
          </div>
        </EditorialSection>
        <EditorialSection number={3} label="On the day" title="What you can expect" id="expect">
          <ul className={editorial.list}>
            {["Small groups, never a big coach", "Local guides who know the area", "Days you can shape to suit you", "Clear, upfront pricing in NZD"].map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </EditorialSection>
      </div>
    </>
  );
}
