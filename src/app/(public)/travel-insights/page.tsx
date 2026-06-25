import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Travel Insights",
  description: "NZ travel tips, guides and stories from the team.",
};

export default async function BlogIndex() {
  const posts = await getPosts();
  return (
    <>
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
