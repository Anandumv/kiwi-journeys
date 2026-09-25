import { serializeJsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTours, getDestinations, getTestimonials, getSiteSettings } from "@/lib/content";
import { categories } from "@/data/tours";
import { formatNZD } from "@/lib/money";
import styles from "@/components/HomeEditorial.module.css";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { CinematicHero } from "@/components/CinematicHero";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: { absolute: `${s.name} — New Zealand Small-Group Day Tours` },
    description: `Explore the South Island with ${s.name}. Small groups, local guides, year-round departures from Christchurch. Book online — free cancellation.`,
    alternates: { canonical: SITE_URL },
    openGraph: {
      title: `${s.name} — New Zealand Small-Group Day Tours`,
      description: s.description,
      url: SITE_URL,
      images: s.heroImage ? [{ url: s.heroImage, width: 1200, height: 630, alt: "Kiwi Journeys — South Island Day Tours" }] : undefined,
    },
  };
}

export default async function HomePage() {
  const [tours, destinations, testimonials, s] = await Promise.all([
    getTours(),
    getDestinations(),
    getTestimonials(),
    getSiteSettings(),
  ]);
  const featured = tours.filter((t) => t.featured).slice(0, 6);
  const lead = featured.find((t) => t.destination !== "Christchurch") ?? featured[0];
  const otherTours = featured.filter((t) => t.slug !== lead?.slug);
  const destinationPhoto = tours.find((t) => t.destination === "Akaroa") ?? lead;
  const activeDestinations = destinations.filter((d) => d.status === "active");

  const reviewsLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Guest Reviews",
    itemListElement: testimonials.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Review",
        reviewRating: { "@type": "Rating", ratingValue: t.rating, bestRating: 5 },
        author: { "@type": "Person", name: t.name },
        reviewBody: t.text,
        itemReviewed: { "@id": `${SITE_URL}/#organization` },
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(reviewsLd) }} />
      <CinematicHero settings={s} views={[
        { label: "Coast", destination: "Kaikōura" },
        { label: "High country", destination: "Lake Tekapo" },
        { label: "Harbour", destination: "Akaroa" },
      ].flatMap(({ label, destination }, index) => {
        const tour = tours.find((t) => t.destination === destination);
        return tour ? [{ label, image: index === 0 ? s.heroImage || tour.heroImage : tour.heroImage, href: `/tours/${tour.slug}` }] : [];
      })} />

      <div className={styles.page}>
        <div className={styles.routeBar}>
          <span>Based in Christchurch</span>
          <span>Across the South Island</span>
          <Link href="/private-tours">Your own itinerary ↗</Link>
        </div>

        <section className={styles.tours} aria-labelledby="tour-heading">
          <div className={styles.sectionHeading}>
            <p className={styles.label}>01 / Days out</p>
            <h2 id="tour-heading">Leave the city.<br />See what’s out there.</h2>
            <Link href="/tours" className={styles.textLink}>Browse all tours ↗</Link>
          </div>
          <div className={styles.tourLayout}>
            {lead && <Link href={`/tours/${lead.slug}`} className={styles.leadTour}>
              <div className={styles.leadPhoto}>
                <Image src={lead.heroImage} alt={lead.title} fill sizes="(max-width: 760px) 100vw, 55vw" className={styles.cover} />
                <span className={styles.photoLabel}>{lead.destination}</span>
              </div>
              <div className={styles.tourMeta}><span>{lead.durationLabel} / {lead.destination}</span><span>From {formatNZD(lead.priceFromCents)}</span></div>
              <h3>{lead.title} <span aria-hidden="true">↗</span></h3>
              <p className={styles.leadSummary}>{lead.summary}</p>
            </Link>}
            <div className={styles.tourIndex}>
              <p className={styles.indexTitle}>Choose a change of scene</p>
              {otherTours.map((t, i) => <Link key={t.slug} href={`/tours/${t.slug}`} className={styles.indexTour}>
                <span className={styles.tourNumber}>{String(i + 2).padStart(2, "0")}</span>
                <div><p className={styles.indexMeta}>{t.destination} / {t.durationLabel}</p><h3>{t.title}</h3><p className={styles.indexPrice}>From {formatNZD(t.priceFromCents)} <span aria-hidden="true">↗</span></p></div>
                <div className={styles.thumb}><Image src={t.heroImage} alt="" fill sizes="100px" className={styles.cover} /></div>
              </Link>)}
              {featured.length === 0 && <p>Browse our tour list for available days out.</p>}
              <Link href="/tours" className={styles.indexAll}>All tours & departure dates <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
          <nav className={styles.categories} aria-label="Tour experiences">
            <span>Go for the</span>
            {categories.map((c) => <Link key={c.key} href={`/tours?type=${c.key}`}>{c.label} ↗</Link>)}
          </nav>
        </section>

        <section className={styles.destinations} aria-labelledby="destination-heading">
          <div className={styles.destinationIntro}>
            <p className={styles.label}>02 / The places</p>
            <h2 id="destination-heading">Our corner<br />of the world.</h2>
            {destinationPhoto && <figure className={styles.destinationFigure}>
              <div className={styles.destinationPhoto}><Image src={destinationPhoto.heroImage} alt={destinationPhoto.title} fill sizes="(max-width: 760px) 100vw, 33vw" className={styles.cover} /></div>
              <figcaption>{destinationPhoto.destination} / South Island, New Zealand</figcaption>
            </figure>}
          </div>
          <div className={styles.destinationList}>
            <p>Pick a place. We’ll take you there.</p>
            {activeDestinations.map((d, i) => <Link key={d.slug} href={`/destinations/${d.slug}`}>
              <span className={styles.destinationNumber}>{String(i + 1).padStart(2, "0")}</span>
              <div><h3>{d.name}</h3><p>{d.blurb}</p></div><span aria-hidden="true">↗</span>
            </Link>)}
            <Link href="/destinations" className={styles.allDestinations}>Explore all destinations ↗</Link>
          </div>
        </section>

        <section className={styles.private} aria-labelledby="private-heading">
          <p className={styles.label}>03 / Make it yours</p>
          <div className={styles.privateLayout}>
            <h2 id="private-heading">Your people.<br />Your kind<br />of day<span>.</span></h2>
            <div className={styles.privateCopy}>
              <p>A family trip, a day with friends, or somewhere you’ve always wanted to go. Tell us what you have in mind.</p>
              <Link href="/private-tours" className={styles.darkCta}>Plan a private tour <span aria-hidden="true">↗</span></Link>
              <div className={styles.practical}>
                <h3>A few practical things</h3>
                <p>Tour pages include pickup details, what’s included and available departures.</p>
                <Link href="/terms-of-use">Read the cancellation policy ↗</Link>
                <Link href="/contact">Ask our team a question ↗</Link>
              </div>
            </div>
          </div>
        </section>

        {testimonials.length > 0 && <section className={styles.guests} aria-label="Guest reviews">
          <p className={styles.label}>In good company</p>
          <div className={styles.quotes}>{testimonials.map((t) => <figure key={`${t.name}-${t.country}`}>
            <blockquote>“{t.text}”</blockquote>
            <figcaption>{t.name} <span>/ {t.country}</span></figcaption>
          </figure>)}</div>
        </section>}
        <NewsletterSignup />
      </div>
    </>
  );
}
