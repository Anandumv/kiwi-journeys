import { serializeJsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getPosts } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export const metadata: Metadata = {
  title: "New Zealand Travel Tips & Guides",
  description: "New Zealand travel tips, South Island itinerary guides, and insider stories from our local team. Plan your Christchurch day trip and beyond.",
  alternates: { canonical: `${SITE_URL}/travel-insights` },
  openGraph: {
    title: "New Zealand Travel Tips & Guides | Kiwi Globe Tours",
    description: "South Island travel tips and itinerary guides from local New Zealand experts.",
    url: `${SITE_URL}/travel-insights`,
    images: [{ url: "/images/general/waipara-plains.jpg", width: 1200, height: 630, alt: "New Zealand Travel Guides" }],
  },
  twitter: { card: "summary_large_image", title: "New Zealand Travel Tips & Guides | Kiwi Globe Tours", description: "South Island travel tips and itinerary guides from local New Zealand experts." },
};

export default async function BlogIndex() {
  const posts = await getPosts();
  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}/travel-insights`,
    url: `${SITE_URL}/travel-insights`,
    name: "New Zealand Travel Tips & Guides",
    description: "South Island travel tips, itinerary guides, and insider stories from the Kiwi Globe Tours team.",
    publisher: { "@id": `${SITE_URL}/#organization` },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Travel Insights", item: `${SITE_URL}/travel-insights` },
      ],
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogLd) }} />
      <PageHero eyebrow="Journal" title="Travel Insights" subtitle="Notes on places, routes and practical details for a South Island day out." image="/images/tours/waipara-wine-trail/7395a4_e62d70f255354f47b42c80ff4c81ed08-mv2_1.jpg"
        caption="Waipara Valley vineyards"
      />
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20" aria-label="Articles">
        <ol className="border-b border-[#202b2626]">
          {posts.map((p, i) => (
            <li key={p.slug} className="sd-rise">
              <Link href={`/travel-insights/${p.slug}`} className="group grid gap-x-8 gap-y-3 border-t border-[#202b2626] py-8 sm:grid-cols-[64px_150px_minmax(0,1fr)_28px] sm:py-10">
                <span className="font-[family-name:var(--font-display)] text-3xl leading-none text-foreground/75" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <time dateTime={new Date(p.date).toISOString()} className="pt-1 text-[11px] font-semibold uppercase tracking-[.13em] text-foreground/75">
                  {new Date(p.date).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}
                </time>
                <div>
                  <h2 className="text-[clamp(26px,3vw,40px)] font-medium leading-[1.05] tracking-[-.03em] text-foreground underline decoration-transparent decoration-1 underline-offset-[6px] transition-colors group-hover:decoration-current">{p.title}</h2>
                  <p className="mt-3 max-w-2xl leading-relaxed text-foreground/72">{p.excerpt}</p>
                </div>
                <span aria-hidden="true" className="hidden text-2xl transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 sm:block">↗</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
