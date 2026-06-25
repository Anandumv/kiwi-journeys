import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { getTours } from "@/lib/content";
import { TourCard } from "@/components/TourCard";

export const metadata: Metadata = {
  title: "Cruise Excursions",
  description: "Shore excursions designed for cruise passengers calling at Lyttelton & Akaroa.",
};

export default async function CruisePage() {
  const tours = await getTours();
  const picks = tours.filter((t) =>
    ["akaroa-day-tour", "christchurch-antarctic-centre", "christchurch-city-sightseeing", "akaroa-swim-with-dolphins"].includes(t.slug),
  );
  return (
    <>
      <PageHero title="Cruise Shore Excursions" subtitle="On a cruise? Exclusive tours designed just for cruise passengers — back to the ship, every time." image="/images/general/kaikoura-whale-watch.jpg" />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 text-foreground/80 leading-relaxed">
        <p>
          Calling at Lyttelton or Akaroa? Our shore excursions are timed around your ship&apos;s
          schedule, with priority pickup and guaranteed return to the port. Explore Christchurch, swim
          with rare Hector&apos;s dolphins, or take in the alpine scenery — all in a day.
        </p>
        <p className="mt-3 text-sm text-foreground/60">
          Travelling as a group from a cruise line? <Link href="/contact" className="font-semibold text-brand-600 hover:underline">Contact us</Link> for tailored group rates.
        </p>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <h2 className="font-serif text-3xl font-semibold text-brand-900">Popular with cruise guests</h2>
        <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {picks.map((t) => <TourCard key={t.slug} tour={t} />)}
        </div>
      </section>
    </>
  );
}
