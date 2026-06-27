import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { PrivateTourForm } from "@/components/PrivateTourForm";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export const metadata: Metadata = {
  title: "Private & Group Tours",
  description:
    "Book a bespoke private tour of New Zealand's South Island for your group. Custom itineraries, flexible dates, expert local guides. Get a personalised quote.",
  alternates: { canonical: `${SITE_URL}/private-tours` },
  openGraph: {
    title: "Private & Group Tours — Kiwi Journeys",
    description: "Craft a bespoke South Island experience for your group.",
    url: `${SITE_URL}/private-tours`,
  },
};

const WHY = [
  {
    title: "Your own vehicle & guide",
    body: "Exclusive use of a comfortable vehicle with a dedicated local guide who knows the hidden gems.",
  },
  {
    title: "Fully flexible itinerary",
    body: "We build the day around what you want to see — no compromise, no rushing to suit a group.",
  },
  {
    title: "Perfect for any occasion",
    body: "Family reunions, honeymoons, corporate retreats, birthday adventures — we've done them all.",
  },
  {
    title: "Groups of any size",
    body: "From an intimate couple to a corporate group of 40+. We'll match the right vehicle and team.",
  },
];

export default function PrivateToursPage() {
  return (
    <>
      <PageHero
        eyebrow="Tailored for you"
        title="Private & Group Tours"
        subtitle="Your own guide, your own pace, your own South Island story."
        image="/images/general/tekapo-church-sunset.jpg"
      />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-brand-900">Request a quote</h2>
            <p className="mt-2 text-sm text-foreground/70">
              Tell us about your group and we'll be in touch within one business day with a
              personalised itinerary and pricing.
            </p>
            <div className="mt-8">
              <PrivateTourForm />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="font-serif text-3xl font-semibold text-brand-900">Why go private?</h2>
            <div className="mt-2 space-y-4">
              {WHY.map((w) => (
                <div
                  key={w.title}
                  className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm"
                >
                  <h3 className="font-semibold text-brand-800">{w.title}</h3>
                  <p className="mt-1 text-sm text-foreground/70">{w.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
