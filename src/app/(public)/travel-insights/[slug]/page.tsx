import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPost, getSiteSettings } from "@/lib/content";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post" };
  const url = `${SITE_URL}/travel-insights/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url,
      publishedTime: new Date(post.date).toISOString(),
      images: post.coverImage ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }] : undefined,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, s] = await Promise.all([getPost(slug), getSiteSettings()]);
  if (!post) notFound();

  const pageUrl = `${SITE_URL}/travel-insights/${post.slug}`;
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": pageUrl,
    headline: post.title,
    description: post.excerpt,
    url: pageUrl,
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    image: post.coverImage ?? undefined,
    author: { "@type": "Organization", name: s.name, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: s.name,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    articleBody: post.body.join(" "),
    keywords: ["New Zealand travel", "South Island", "travel tips", "NZ tourism"],
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Travel Insights", item: `${SITE_URL}/travel-insights` },
      { "@type": "ListItem", position: 3, name: post.title, item: pageUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <article className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <Link href="/travel-insights" className="text-sm font-semibold text-brand-600 hover:underline">← All insights</Link>
        <time className="mt-6 block text-xs font-medium uppercase tracking-wider text-brand-500">
          {new Date(post.date).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}
        </time>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-brand-900 text-balance">{post.title}</h1>
        <div className="mt-8 space-y-5 text-lg leading-relaxed text-foreground/80">
          {post.body.map((para, i) => <p key={i}>{para}</p>)}
        </div>

        {/* Book a tour CTA */}
        <div className="mt-14 rounded-2xl bg-brand-50 border border-brand-100 px-8 py-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">Ready to explore?</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-brand-900">
            See New Zealand with {s.name}
          </h2>
          <p className="mt-3 text-sm text-foreground/60 max-w-md mx-auto">
            Small groups, local guides, and hand-crafted itineraries across the South Island. Free cancellation on most tours.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/tours"
              className="inline-block rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition"
            >
              Browse all tours →
            </Link>
            <Link
              href="/contact"
              className="inline-block rounded-full border border-brand-300 px-7 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition"
            >
              Ask a question
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-ivory-200 pt-6">
          <Link href="/travel-insights" className="text-sm font-semibold text-brand-600 hover:underline">← Back to Travel Insights</Link>
        </div>
      </article>
    </>
  );
}
