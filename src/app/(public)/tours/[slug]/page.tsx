import { absoluteUrl, serializeJsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { getTour, getTours, getSiteSettings } from "@/lib/content";
import { Gallery } from "@/components/Gallery";
import { TourCard } from "@/components/TourCard";
import { CurrencyConverter } from "@/components/CurrencyConverter";
import { formatNZD } from "@/lib/money";
import styles from "@/components/TourDetail.module.css";

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
  const fromChch = tour.destination !== "Christchurch" ? ` | Day Trip from Christchurch` : ` | Christchurch Day Tour`;
  const seoTitle = `${tour.title}${fromChch}`;
  // Keep the snippet inside Google's ~155-char window, leading with price and refund terms.
  const terms = ` From ${formatNZD(tour.priceFromCents)} pp. Full refund 72+ hrs before. Book online.`;
  const room = 158 - terms.length;
  const lead = tour.summary.length <= room ? tour.summary : `${tour.summary.slice(0, room - 1).replace(/[\s,;:—–-]+\S*$/, "")}…`;
  const seoDesc = `${lead}${terms}`;
  return {
    title: seoTitle,
    description: seoDesc,
    alternates: { canonical: url },
    openGraph: {
      title: seoTitle,
      description: seoDesc,
      type: "article",
      url,
      images: image ? [{ url: image, width: 1200, height: 630, alt: tour.title }] : undefined,
    },
    twitter: { card: "summary_large_image", title: seoTitle, description: seoDesc, images: image ? [image] : undefined },
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
  const ldImages = (tour.gallery.length ? tour.gallery : [tour.heroImage])
    .map((src) => absoluteUrl(SITE_URL, src))
    .filter((src): src is string => Boolean(src));

  const tripLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": pageUrl,
    name: tour.title,
    description: tour.summary,
    url: pageUrl,
    image: ldImages.length ? ldImages : undefined,
    duration: isoMinutes(tour.durationMins),
    touristType: { "@type": "Audience", audienceType: "Tourists" },
    itinerary: tour.itinerary.length
      ? {
          "@type": "ItemList",
          numberOfItems: tour.itinerary.length,
          itemListElement: tour.itinerary.map((step, i) => ({ "@type": "ListItem", position: i + 1, description: step })),
        }
      : undefined,
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
  // Product schema unlocks price/availability rich results in Google Search
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${pageUrl}#product`,
    name: tour.title,
    description: tour.summary,
    image: ldImages,
    brand: { "@type": "Brand", name: settings.name },
    offers: {
      "@type": "Offer",
      url: `${pageUrl}/book`,
      priceCurrency: "NZD",
      price: (tour.priceFromCents / 100).toFixed(2),
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
      availability: "https://schema.org/InStock",
      seller: { "@id": `${SITE_URL}/#organization` },
    },
  };

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
    <div className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(tripLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />

      <section className={styles.hero} aria-labelledby="tour-title">
        <div className={styles.copy}>
          <nav aria-label="Breadcrumb" className={styles.crumbs}>
            <Link href="/tours">Tours</Link>
            <span aria-hidden="true">/</span>
            <span>{tour.destination}</span>
          </nav>
          <h1 id="tour-title" className={styles.title}>{tour.title}</h1>
          <p className={styles.summary}>{tour.summary}</p>
          <dl className={styles.facts}>
            <div><dt>Duration</dt><dd>{tour.durationLabel}</dd></div>
            <div><dt>From</dt><dd>{formatNZD(tour.priceFromCents)} per person</dd></div>
            <div><dt>Route</dt><dd>{tour.startEnd}</dd></div>
            <div><dt>Ages</dt><dd>{tour.ageRange}</dd></div>
          </dl>
          <div className={styles.heroActions}>
            <Link href={`/tours/${tour.slug}/book`} className={styles.cta}>Check dates <span aria-hidden="true">↗</span></Link>
            <p className={styles.policy}>Full refund when cancelled more than 72 hours before.</p>
          </div>
        </div>
        <ViewTransition name={`tour-photo-${tour.slug}`} share="morph">
        <div className={styles.media}>
          <Gallery images={tour.gallery.length ? tour.gallery : [tour.heroImage].filter(Boolean)} title={tour.title} />
        </div>
        </ViewTransition>
      </section>

      <div className={styles.body}>
        <div className={styles.main}>
          {tour.highlights.length > 0 && (
            <section className={`${styles.section} sd-rise`} aria-labelledby="highlights">
              <p className={styles.label}><b>01</b>Highlights</p>
              <div>
                <h2 id="highlights" className={styles.heading}>What you&apos;ll see</h2>
                <ul className={styles.highlights}>
                  {tour.highlights.map((h) => <li key={h}>{h}</li>)}
                </ul>
              </div>
            </section>
          )}

          {tour.itinerary.length > 0 && (
            <section className={`${styles.section} sd-rise`} aria-labelledby="the-day">
              <p className={styles.label}><b>02</b>The day</p>
              <div>
                <h2 id="the-day" className={styles.heading}>How the day runs</h2>
                <ol className={styles.timeline}>
                  {tour.itinerary.map((step, i) => <li key={i}><p>{step}</p></li>)}
                </ol>
              </div>
            </section>
          )}

          <section className={`${styles.section} sd-rise`} aria-labelledby="included">
            <p className={styles.label}><b>03</b>Included</p>
            <div>
              <h2 id="included" className={styles.heading}>What&apos;s in the price</h2>
              <div className={styles.lists}>
                <div>
                  <h3>Included</h3>
                  <ul>{tour.included.map((x) => <li key={x}>{x}</li>)}</ul>
                </div>
                {tour.optionalUpgrades && tour.optionalUpgrades.length > 0 && (
                  <div>
                    <h3>Optional extras</h3>
                    <ul>{tour.optionalUpgrades.map((x) => <li key={x} className={styles.upgrade}>{x}</li>)}</ul>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className={`${styles.section} sd-rise`} aria-labelledby="good-to-know">
            <p className={styles.label}><b>04</b>Good to know</p>
            <div>
              <h2 id="good-to-know" className={styles.heading}>Before you go</h2>
              <p className={styles.lede}>{tour.pickup}</p>
              {tour.importantInfo && tour.importantInfo.length > 0 && (
                <ul className={styles.notes}>{tour.importantInfo.map((x) => <li key={x}>{x}</li>)}</ul>
              )}
            </div>
          </section>
        </div>

        <aside className={styles.aside} aria-label="Book this tour">
          <div className={styles.panel}>
            <p className={styles.panelLabel}>Price from</p>
            <p className={styles.price}>{formatNZD(tour.priceFromCents)}<small>/ person</small></p>
            <dl className={styles.options}>
              {tour.priceOptions.map((po) => (
                <div key={po.key}><dt>{po.label}</dt><dd>{formatNZD(po.priceCents)}</dd></div>
              ))}
            </dl>
            <CurrencyConverter priceFromCents={tour.priceFromCents} rates={settings.currencyRates} />
            <Link href={`/tours/${tour.slug}/book`} className={styles.cta}>Check availability <span aria-hidden="true">↗</span></Link>
            <ul className={styles.assurances}>
              <li>Full refund when cancelled more than 72 hours before.</li>
              <li>Charged in NZD. No booking fee.</li>
            </ul>
            <dl className={styles.panelFacts}>
              {facts.map((f) => (
                <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>
              ))}
            </dl>
            <Link href="/contact" className={styles.ask}>Ask us about this day</Link>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className={styles.related} aria-labelledby="related">
          <div className={styles.relatedInner}>
            <div className={styles.relatedHead}>
              <h2 id="related">More days like this</h2>
              <Link href="/tours">All tours</Link>
            </div>
            <div className={styles.relatedGrid}>
              {related.map((t) => <TourCard key={t.slug} tour={t} />)}
            </div>
          </div>
        </section>
      )}

      <div className={styles.spacer} />
      <div className={styles.bar}>
        <p>From<strong>{formatNZD(tour.priceFromCents)}</strong></p>
        <Link href={`/tours/${tour.slug}/book`} className={styles.cta}>Check availability <span aria-hidden="true">↗</span></Link>
      </div>
    </div>
  );
}
