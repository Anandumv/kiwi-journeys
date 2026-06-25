import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTour, getTours, getSiteSettings } from "@/lib/content";
import { Gallery } from "@/components/Gallery";
import { TourCard } from "@/components/TourCard";
import { CurrencyConverter } from "@/components/CurrencyConverter";
import { formatNZD } from "@/lib/money";
import { PaymentBadges } from "@/components/TrustBadges";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

function isoMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `PT${h > 0 ? `${h}H` : ""}${m > 0 ? `${m}M` : ""}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTour(slug);
  if (!tour) return { title: "Tour" };
  const url = `${SITE_URL}/tours/${tour.slug}`;
  const image = tour.heroImage || tour.gallery?.[0] || "";
  return {
    title: tour.title,
    description: tour.summary,
    alternates: { canonical: url },
    openGraph: {
      title: `${tour.title} | New Zealand Day Tour`,
      description: tour.summary,
      type: "article",
      url,
      images: image ? [{ url: image, width: 1200, height: 630, alt: tour.title }] : undefined,
    },
    twitter: { card: "summary_large_image", title: tour.title, description: tour.summary, images: image ? [image] : undefined },
  };
}

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [tour, allTours, settings] = await Promise.all([getTour(slug), getTours(), getSiteSettings()]);
  if (!tour) notFound();

  const related = allTours.filter((t) => t.slug !== tour.slug && t.category === tour.category).slice(0, 3);
  const facts = [
    { label: "Duration", value: tour.durationLabel },
    { label: "Location", value: tour.destination },
    { label: "Age range", value: tour.ageRange },
    { label: "Route", value: tour.startEnd },
    { label: "Language", value: "English" },
    { label: "Payment", value: "Pay online" },
  ];

  const pageUrl = `${SITE_URL}/tours/${tour.slug}`;
  const tripLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": pageUrl,
    name: tour.title,
    description: tour.summary,
    url: pageUrl,
    image: tour.gallery.length ? tour.gallery : undefined,
    duration: isoMinutes(tour.durationMins),
    touristType: { "@type": "Audience", audienceType: "Tourists" },
    itinerary: tour.itinerary.map((step, i) => ({ "@type": "Place", name: `Stop ${i + 1}`, description: step })),
    provider: { "@id": `${SITE_URL}/#organization` },
    tourOperator: { "@id": `${SITE_URL}/#organization` },
    offers: {
      "@type": "Offer",
      url: `${pageUrl}/book`,
      price: (tour.priceFromCents / 100).toFixed(2),
      priceCurrency: "NZD",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString().split("T")[0],
    },
  };
  const faqItems = [
    { q: `How long is the ${tour.title}?`, a: `The tour duration is ${tour.durationLabel}.` },
    { q: "What is included in the tour price?", a: tour.included.join(". ") || "See tour details for inclusions." },
    { q: "What age group is this tour suitable for?", a: `This tour is suitable for ${tour.ageRange}.` },
    ...(tour.startEnd ? [{ q: "Where does the tour start and end?", a: tour.startEnd }] : []),
    ...(tour.pickup ? [{ q: "Is hotel pickup available?", a: tour.pickup }] : []),
    ...(tour.importantInfo ?? []).map((info, i) => ({ q: `Important information ${i + 1}`, a: info })),
  ].filter((f) => f.a.trim().length > 5);

  const faqLd = faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  } : null;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Tours", item: `${SITE_URL}/tours` },
      { "@type": "ListItem", position: 3, name: tour.title, item: pageUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(tripLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      {/* Title bar */}
      <div className="bg-brand-50 border-b border-brand-100">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600">
            <Link href="/tours" className="hover:underline">Tours</Link>
            <span>/</span>
            <span className="rounded-full bg-white px-2 py-0.5">{tour.code}</span>
          </div>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-brand-900 sm:text-5xl">{tour.title}</h1>
          <p className="mt-2 max-w-2xl text-foreground/70">{tour.summary}</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left: gallery + content */}
        <div>
          <Gallery images={tour.gallery} title={tour.title} />

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-brand-900">Highlights</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {tour.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-foreground/80">
                  <span className="mt-1 text-brand-500">✦</span>{h}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-brand-900">What to Expect</h2>
            <ol className="mt-4 space-y-4">
              {tour.itinerary.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">{i + 1}</span>
                  <p className="text-foreground/80 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <section>
              <h2 className="text-xl font-bold text-brand-900">What&apos;s Included</h2>
              <ul className="mt-3 space-y-2">
                {tour.included.map((x) => (
                  <li key={x} className="flex items-start gap-2 text-sm text-foreground/80"><span className="mt-0.5 text-brand-500">✓</span>{x}</li>
                ))}
              </ul>
            </section>
            {tour.optionalUpgrades && tour.optionalUpgrades.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-brand-900">Optional Upgrades</h2>
                <ul className="mt-3 space-y-2">
                  {tour.optionalUpgrades.map((x) => (
                    <li key={x} className="flex items-start gap-2 text-sm text-foreground/80"><span className="mt-0.5 text-sand-500">+</span>{x}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {tour.importantInfo && tour.importantInfo.length > 0 && (
            <section className="mt-10 rounded-2xl border border-sand-400/40 bg-sand-400/10 p-6">
              <h2 className="text-lg font-bold text-brand-900">Important Information</h2>
              <ul className="mt-3 space-y-2">
                {tour.importantInfo.map((x) => (
                  <li key={x} className="text-sm text-foreground/80">• {x}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Right: sticky booking sidebar */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-gold-500" aria-hidden>★★★★★</span>
              <span className="text-foreground/55">Loved by our guests</span>
            </div>
            <div className="mt-3 text-sm text-foreground/60">Price from</div>
            <div className="font-serif text-3xl font-bold text-brand-700">{formatNZD(tour.priceFromCents)} <span className="text-base font-normal text-foreground/50">/ person</span></div>

            <div className="mt-4 space-y-2">
              {tour.priceOptions.map((po) => (
                <div key={po.key} className="flex items-center justify-between border-b border-brand-50 pb-2 text-sm">
                  <span className="text-foreground/80">{po.label}</span>
                  <span className="font-semibold text-brand-700">{formatNZD(po.priceCents)}</span>
                </div>
              ))}
            </div>

            <CurrencyConverter priceFromCents={tour.priceFromCents} rates={settings.currencyRates} />

            <Link
              href={`/tours/${tour.slug}/book`}
              className="mt-4 block rounded-full bg-sand-500 px-6 py-3.5 text-center font-semibold text-white shadow-sm transition hover:bg-sand-700"
            >
              Check Availability &amp; Book
            </Link>
            <div className="mt-3 space-y-1 text-center text-xs text-foreground/55">
              <p><span className="text-teal-600">✓</span> Free cancellation up to 48 h before</p>
              <p><span className="text-teal-600">✓</span> Small groups · max 16 guests · Locally owned</p>
              <p><span className="text-teal-600">✓</span> No booking fees — best price direct</p>
            </div>
            <PaymentBadges className="mt-4 border-t border-brand-50 pt-4" />
            <Link href="/contact" className="mt-3 block text-center text-sm font-medium text-brand-600 hover:underline">
              Have questions? Contact us
            </Link>

            <dl className="mt-6 space-y-2 border-t border-brand-50 pt-4">
              {facts.map((f) => (
                <div key={f.label} className="flex justify-between text-sm">
                  <dt className="text-foreground/55">{f.label}</dt>
                  <dd className="font-medium text-brand-800 text-right">{f.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-foreground/50">{tour.pickup}</p>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <h2 className="font-serif text-2xl font-semibold text-brand-900 sm:text-3xl">You might also like</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t) => <TourCard key={t.slug} tour={t} />)}
          </div>
        </section>
      )}

      {/* Mobile sticky book bar */}
      <div className="h-20 lg:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-ivory-200 bg-ivory/95 px-4 py-3 backdrop-blur lg:hidden">
        <div>
          <div className="text-xs text-foreground/55">from</div>
          <div className="font-serif text-lg font-semibold text-brand-700">{formatNZD(tour.priceFromCents)}</div>
        </div>
        <Link href={`/tours/${tour.slug}/book`} className="rounded-full bg-sand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition active:bg-sand-700">
          Check availability
        </Link>
      </div>
    </>
  );
}
