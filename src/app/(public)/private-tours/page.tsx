import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { PrivateTourForm } from "@/components/PrivateTourForm";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export const metadata: Metadata = {
  title: "Your day, your way",
  description:
    "Book a bespoke private tour of New Zealand's South Island for your group. Custom itineraries, flexible dates, expert local guides. Get a personalised quote.",
  alternates: { canonical: `${SITE_URL}/private-tours` },
  openGraph: {
    title: "Your day, your way — Kiwi Journeys",
    description: "Craft a bespoke South Island experience for your group.",
    url: `${SITE_URL}/private-tours`,
  },
};

const WHY = [
  {
    title: "Your own vehicle & guide",
    body: "Travel with your own driver-guide and vehicle for the day.",
  },
  {
    title: "Fully flexible itinerary",
    body: "Choose the stops and pace that matter to your group.",
  },
  {
    title: "Travel to your own timetable",
    body: "A useful option when your group needs a different pace or pickup.",
  },
  {
    title: "Groups of any size",
    body: "Tell us your group size so we can suggest a suitable vehicle.",
  },
];

export default function PrivateToursPage() {
  return (
    <>
      <PageHero
        eyebrow="Tailored for you"
        title="Your day, your way"
        subtitle="A private day trip with your own guide and a route shaped around your group."
        image="/images/tours/christchurch-city-sightseeing/7395a4_a8f740b4a88b4e619592b9ba71877df9-mv2_1.jpg"
        caption="Botanic Gardens, Christchurch"
      />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-foreground">Request a quote</h2>
            <p className="mt-2 text-sm text-foreground/75">
              Tell us about your group and we'll be in touch within one business day with a
              personalised itinerary and pricing.
            </p>
            <div className="mt-8">
              <PrivateTourForm />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="font-serif text-3xl font-semibold text-foreground">Why go private?</h2>
            <div className="mt-2 space-y-4">
              {WHY.map((w) => (
                <div
                  key={w.title}
                  className="border-t border-[#202b2626] py-5"
                >
                  <h3 className="font-semibold text-foreground">{w.title}</h3>
                  <p className="mt-1 text-sm text-foreground/75">{w.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
