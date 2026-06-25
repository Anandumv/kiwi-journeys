import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { TourCard } from "@/components/TourCard";
import { getDestinations, getTours } from "@/lib/content";

// Map a destination slug to the tours that visit it (loose match on destination text).
const regionMatch: Record<string, (dest: string) => boolean> = {
  christchurch: (d) => d.includes("Christchurch") || d === "Waimakariri",
  akaroa: (d) => d.includes("Akaroa"),
  kaikoura: (d) => d.includes("Kaik"),
  waipara: (d) => d.includes("Waipara"),
  "hanmer-springs": (d) => d.includes("Hanmer"),
};

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const { region } = await params;
  const destinations = await getDestinations();
  const dest = destinations.find((d) => d.slug === region);
  return { title: dest ? dest.name : "Destination" };
}

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  const [destinations, tours] = await Promise.all([getDestinations(), getTours()]);
  const dest = destinations.find((d) => d.slug === region && d.status === "active");
  if (!dest) notFound();

  const match = regionMatch[region] ?? (() => false);
  const regionTours = tours.filter((t) => match(t.destination));

  return (
    <>
      <PageHero eyebrow="Destination" title={dest.name} subtitle={dest.intro ?? dest.blurb} image={dest.heroImage ?? undefined} />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="font-serif text-3xl font-semibold text-brand-900">Tours in {dest.name}</h2>
        {regionTours.length === 0 ? (
          <p className="mt-4 text-foreground/60">New tours for this destination are coming soon.</p>
        ) : (
          <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {regionTours.map((t) => <TourCard key={t.slug} tour={t} />)}
          </div>
        )}
      </section>
    </>
  );
}
