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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogLd) }} />
      <PageHero eyebrow="Journal" title="Travel Insights" subtitle="Tips, guides and stories to help you plan your New Zealand journey." image="/images/general/waipara-plains.jpg" />
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <div className="space-y-6">
          {posts.map((p) => (
            <Link key={p.slug} href={`/travel-insights/${p.slug}`} className="block rounded-2xl border border-ivory-200 bg-white p-6 transition hover:shadow-md">
              <time className="text-xs font-medium text-brand-500">
                {new Date(p.date).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}
              </time>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-brand-900">{p.title}</h2>
              <p className="mt-2 text-sm text-foreground/70">{p.excerpt}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-brand-600">Read more →</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
