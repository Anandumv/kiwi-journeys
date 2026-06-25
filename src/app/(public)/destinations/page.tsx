import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getDestinations } from "@/lib/content";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Explore New Zealand destinations — Christchurch, Akaroa, Kaikōura, Waipara and more.",
};

export default async function DestinationsPage() {
  const destinations = await getDestinations();
  return (
    <>
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
