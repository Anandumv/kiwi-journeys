import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { EditorialSection, editorial } from "@/components/EditorialSection";

export const metadata: Metadata = {
  title: "Sustainability",
  description: "Our commitment to the Tiaki Promise and caring for Aotearoa.",
  alternates: { canonical: "/sustainability" },
};

export default function SustainabilityPage() {
  return (
    <>
      <PageHero title="Sustainability" subtitle="How we work with local places, people and operators." image="/images/tours/akaroa-swim-with-dolphins/7395a4_4a8fe75394104798b8b10a3092051971-mv2_3.jpg"
        caption="Hector's dolphins, Akaroa"
      />
      <div className={editorial.wrap}>
        <EditorialSection number={1} label="Our commitment" title="The Tiaki Promise" id="tiaki">
          <div className={editorial.prose}>
            <p>
              The Tiaki Promise is a commitment to care for New Zealand — to act as guardians, protecting
              and preserving our home for future generations. As you travel with us, we ask that you care
              for land, sea and nature, treading lightly and leaving no trace.
            </p>
          </div>
        </EditorialSection>
        <EditorialSection number={2} label="In practice" title="How we travel responsibly" id="practice">
          <ul className={editorial.list}>
            {[
              "Small-group tours that minimise our footprint",
              "Supporting local operators, growers and communities",
              "Respecting wildlife with guidelines-led encounters",
              "Protecting fragile alpine and marine environments",
            ].map((x) => <li key={x}>{x}</li>)}
          </ul>
        </EditorialSection>
        <EditorialSection number={3} label="Who we work with" title="Local operators, local benefit" id="partners">
          <div className={editorial.prose}>
            <p>
              We partner with local operators — from Hector&apos;s dolphin
              encounters to alpine rail journeys — so your visit helps sustain the places you came to see.
            </p>
          </div>
        </EditorialSection>
      </div>
    </>
  );
}
