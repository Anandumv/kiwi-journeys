import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Sustainability",
  description: "Our commitment to the Tiaki Promise and caring for Aotearoa.",
};

export default function SustainabilityPage() {
  return (
    <>
      <PageHero title="Sustainability" subtitle="Caring for the people and the land of Aotearoa." image="/images/general/aoraki-mt-cook.jpg" />
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 space-y-5 text-foreground/80 leading-relaxed">
        <h2 className="text-2xl font-bold text-brand-900">The Tiaki Promise</h2>
        <p>
          The Tiaki Promise is a commitment to care for New Zealand — to act as guardians, protecting
          and preserving our home for future generations. As you travel with us, we ask that you care
          for land, sea and nature, treading lightly and leaving no trace.
        </p>
        <h2 className="text-2xl font-bold text-brand-900 pt-4">How we travel responsibly</h2>
        <ul className="space-y-2">
          {[
            "Small-group tours that minimise our footprint",
            "Supporting local operators, growers and communities",
            "Respecting wildlife with guidelines-led encounters",
            "Protecting fragile alpine and marine environments",
          ].map((x) => (
            <li key={x} className="flex items-start gap-2"><span className="mt-1 text-brand-500">✓</span>{x}</li>
          ))}
        </ul>
        <p className="pt-2">
          We partner with award-winning, conservation-minded operators — from Hector&apos;s dolphin
          encounters to alpine rail journeys — so your visit helps sustain the places you came to see.
        </p>
      </article>
    </>
  );
}
